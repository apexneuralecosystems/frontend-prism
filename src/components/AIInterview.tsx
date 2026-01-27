import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

interface TranscriptMessage {
    timestamp: string;
    role: 'user' | 'assistant';
    text: string;
}

export function AIInterview() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const jobId = searchParams.get('job_id');
    const email = searchParams.get('email');

    const [status, setStatus] = useState<'initializing' | 'connecting' | 'active' | 'ending' | 'complete' | 'error'>('initializing');
    const [error, setError] = useState<string | null>(null);
    const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [interviewStarted, setInterviewStarted] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const [screenShareStopped, setScreenShareStopped] = useState(false);

    // Refs for WebSocket and media
    const wsRef = useRef<WebSocket | null>(null);
    const cameraStreamRef = useRef<MediaStream | null>(null);
    const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);
    const audioDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
    const transcriptEndRef = useRef<HTMLDivElement>(null);
    
    // Audio queue management to prevent overlapping playback
    const audioQueueRef = useRef<Float32Array[]>([]);
    const isPlayingRef = useRef<boolean>(false);
    const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

    useEffect(() => {
        if (!jobId || !email) {
            setError('Missing job_id or email parameters');
            setStatus('error');
            return;
        }

        initializeInterview();

        return () => {
            cleanup();
        };
    }, [jobId, email]);

    useEffect(() => {
        // Auto-scroll transcript to bottom
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    useEffect(() => {
        const video = cameraVideoRef.current;
        const stream = cameraStreamRef.current;
        if (!video || !stream) return;
        video.srcObject = stream;
        video.play().catch(() => {});
        return () => {
            video.srcObject = null;
        };
    }, [cameraReady, status]);

    const initializeInterview = async () => {
        try {
            setStatus('initializing');
            
            // Start interview session
            const response = await fetch(`${API_BASE_URL}/api/ai-interview/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    job_id: jobId,
                    email: email
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                if (response.status === 400 && errorData.detail?.includes('already completed')) {
                    throw new Error('This interview has already been completed. Each interview link can only be used once.');
                }
                throw new Error(errorData.detail || 'Failed to start interview session');
            }

            const data = await response.json();
            setSessionId(data.session_id);

            // Request microphone and screen permissions
            await setupMedia();

            // Connect to WebSocket
            await connectWebSocket(data.ws_url, data.session_id);

        } catch (err: any) {
            console.error('Error initializing interview:', err);
            setError(err.message || 'Failed to initialize interview');
            setStatus('error');
        }
    };

    const setupMedia = async () => {
        try {
            // STEP 1: REQUIRE full screen/window sharing with audio FIRST (like reference)
            setStatus('connecting');
            
            let screenStream: MediaStream;
            try {
                screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: {
                        mediaSource: 'screen',
                        displaySurface: 'monitor'  // Require entire display/window
                    } as any,
                    audio: true  // Require system audio
                });

                // Validate that we got the ENTIRE SCREEN (monitor only)
                const videoTrack = screenStream.getVideoTracks()[0];
                if (videoTrack) {
                    const settings = videoTrack.getSettings();
                    console.log('📺 Screen sharing settings:', settings);

                    // Check if it's the ENTIRE SCREEN (monitor) - NOT window or tab
                    if ((settings as any).displaySurface !== 'monitor') {
                        videoTrack.stop();
                        screenStream.getTracks().forEach(track => track.stop());
                        throw new Error('REQUIRED: You must share your ENTIRE SCREEN (not a window or browser tab) to start the interview.\n\nPlease select "Entire Screen" or "Screen 1/2/3" when sharing.');
                    }
                }

                // Validate that system audio is included
                const audioTracks = screenStream.getAudioTracks();
                if (audioTracks.length === 0) {
                    videoTrack?.stop();
                    screenStream.getTracks().forEach(track => track.stop());
                    throw new Error('REQUIRED: You must share your screen WITH AUDIO.\n\nPlease check the "Share audio" or "Share tab audio" option when sharing your screen.');
                }

                if (videoTrack) {
                    videoTrack.onended = () => setScreenShareStopped(true);
                }
                console.log('✅ Screen sharing enabled (entire screen with audio)');
            } catch (screenErr: any) {
                console.error('Screen sharing error:', screenErr);
                throw new Error(screenErr.message || 'You must share your ENTIRE SCREEN with audio to start the interview.');
            }

            // STEP 2: Request microphone permission
            const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('✅ Microphone access granted');

            // STEP 3: Request camera for live self-view
            const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
            cameraStreamRef.current = cameraStream;
            setCameraReady(true);
            console.log('✅ Camera access granted');

            // Create audio context (24000 Hz for pcm16 like reference browser mode)
            const audioContext = new AudioContext({ sampleRate: 24000 });
            audioContextRef.current = audioContext;

            // Create destination for AI audio
            const aiAudioDestination = audioContext.createMediaStreamDestination();
            audioDestinationRef.current = aiAudioDestination;

            // Combine streams for recording
            // NOTE: We only need video, microphone, and AI audio
            // System audio from screen share can cause echo/feedback
            const combinedStream = new MediaStream([
                ...screenStream.getVideoTracks(),  // Screen video
                ...micStream.getAudioTracks(),     // Microphone only (not system audio)
                ...aiAudioDestination.stream.getAudioTracks()  // AI voice (captured separately)
            ]);

            // Setup MediaRecorder
            const mediaRecorder = new MediaRecorder(combinedStream, {
                mimeType: 'video/webm;codecs=vp9,opus'
            });

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current = mediaRecorder;

            console.log('✅ Media setup complete');
        } catch (err: any) {
            if (cameraStreamRef.current) {
                cameraStreamRef.current.getTracks().forEach((t) => t.stop());
                cameraStreamRef.current = null;
                setCameraReady(false);
            }
            console.error('Media setup error:', err);
            throw new Error(err.message || 'Please grant screen sharing, microphone, and camera permissions to continue');
        }
    };

    const connectWebSocket = async (wsUrl: string, sessionId: string) => {
        return new Promise<void>((resolve, reject) => {
            try {
                setStatus('connecting');

                const ws = new WebSocket(wsUrl);
                wsRef.current = ws;

                ws.onopen = async () => {
                    console.log('✅ WebSocket connected');
                    setStatus('active');
                    setInterviewStarted(true);

                    // Start recording
                    if (mediaRecorderRef.current) {
                        mediaRecorderRef.current.start(1000); // Capture every second
                        setIsRecording(true);
                        console.log('🎥 Recording started');
                    }

                    // IMPORTANT: Delay before starting audio capture
                    // Give the AI time to start speaking first (prevent false speech detection)
                    console.log('⏳ Waiting 3 seconds before starting microphone...');
                    setTimeout(async () => {
                        // Start capturing audio from microphone
                        await startAudioCapture(ws);
                        console.log('🎤 Microphone capture started');
                    }, 3000);  // 3 second delay

                    resolve();
                };

                ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        handleWebSocketMessage(data);
                    } catch (err) {
                        console.error('Error parsing WebSocket message:', err);
                    }
                };

                ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    setError('Connection error. Please check your internet connection.');
                    setStatus('error');
                    reject(error);
                };

                ws.onclose = () => {
                    console.log('🔌 WebSocket closed');
                    if (status !== 'ending' && status !== 'complete') {
                        setError('Connection closed unexpectedly');
                        setStatus('error');
                    }
                };

            } catch (err) {
                console.error('WebSocket connection error:', err);
                reject(err);
            }
        });
    };

    const startAudioCapture = async (ws: WebSocket) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const audioContext = audioContextRef.current;

            if (!audioContext) return;

            const source = audioContext.createMediaStreamSource(stream);
            const processor = audioContext.createScriptProcessor(4096, 1, 1);

            source.connect(processor);
            processor.connect(audioContext.destination);

            processor.onaudioprocess = (e) => {
                if (ws.readyState === WebSocket.OPEN) {
                    const inputData = e.inputBuffer.getChannelData(0);
                    
                    // Convert to PCM16
                    const pcm16 = new Int16Array(inputData.length);
                    for (let i = 0; i < inputData.length; i++) {
                        const s = Math.max(-1, Math.min(1, inputData[i]));
                        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                    }

                    // Convert to base64
                    const base64 = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));

                    // Send to server
                    ws.send(JSON.stringify({
                        event: 'media',
                        media: {
                            payload: base64
                        }
                    }));
                }
            };

            // Send start event
            ws.send(JSON.stringify({
                event: 'start',
                streamSid: sessionId
            }));

        } catch (err) {
            console.error('Error starting audio capture:', err);
        }
    };

    const handleWebSocketMessage = (data: any) => {
        const eventType = data.event;

        if (eventType === 'transcription') {
            // User transcription
            const message: TranscriptMessage = {
                timestamp: new Date().toISOString(),
                role: 'user',
                text: data.text
            };
            setTranscript(prev => [...prev, message]);
        } else if (eventType === 'ai_response') {
            // AI response (incremental)
            setTranscript(prev => {
                const lastMessage = prev[prev.length - 1];
                if (lastMessage && lastMessage.role === 'assistant') {
                    // Append to last AI message
                    return [
                        ...prev.slice(0, -1),
                        { ...lastMessage, text: lastMessage.text + data.text }
                    ];
                } else {
                    // New AI message
                    return [
                        ...prev,
                        {
                            timestamp: new Date().toISOString(),
                            role: 'assistant',
                            text: data.text
                        }
                    ];
                }
            });
        } else if (eventType === 'media') {
            // AI audio chunk
            playAudioChunk(data.media.payload);
        } else if (eventType === 'stop_audio') {
            // User started speaking - STOP AI audio immediately
            console.log('🛑 User started speaking - stopping AI audio');
            
            // Stop current audio source
            if (currentSourceRef.current) {
                try {
                    currentSourceRef.current.stop();
                    currentSourceRef.current = null;
                } catch (e) {
                    // Already stopped
                }
            }
            
            // Clear audio queue
            audioQueueRef.current = [];
            isPlayingRef.current = false;
        }
    };

    const playAudioChunk = (base64Audio: string) => {
        try {
            const audioContext = audioContextRef.current;
            if (!audioContext) return;

            // Decode base64 to PCM16
            const binaryString = atob(base64Audio);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            const pcm16 = new Int16Array(bytes.buffer);

            // Convert PCM16 to Float32
            const float32 = new Float32Array(pcm16.length);
            for (let i = 0; i < pcm16.length; i++) {
                float32[i] = pcm16[i] / (pcm16[i] < 0 ? 0x8000 : 0x7FFF);
            }

            // Add to queue instead of playing immediately
            audioQueueRef.current.push(float32);
            
            // Start playing queue if not already playing
            if (!isPlayingRef.current) {
                playAudioQueue();
            }

        } catch (err) {
            console.error('Error decoding audio chunk:', err);
        }
    };

    const playAudioQueue = async () => {
        const audioContext = audioContextRef.current;
        const aiAudioDestination = audioDestinationRef.current;
        
        if (!audioContext || !aiAudioDestination) return;
        
        // Prevent multiple simultaneous playbacks
        if (isPlayingRef.current) return;
        
        isPlayingRef.current = true;
        
        while (audioQueueRef.current.length > 0) {
            const float32 = audioQueueRef.current.shift();
            if (!float32) continue;
            
            try {
                // Create and play audio buffer
                const audioBuffer = audioContext.createBuffer(1, float32.length, audioContext.sampleRate);
                audioBuffer.getChannelData(0).set(float32);
                
                // Create source and connect
                const source = audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContext.destination);  // Play to speakers
                source.connect(aiAudioDestination);  // Send to recording
                
                // Store reference to current source so it can be stopped
                currentSourceRef.current = source;
                
                // Wait for this chunk to finish before playing next
                await new Promise<void>((resolve) => {
                    source.onended = () => {
                        currentSourceRef.current = null;
                        resolve();
                    };
                    source.start();
                });
                
            } catch (err) {
                console.error('Error playing audio from queue:', err);
                currentSourceRef.current = null;
            }
        }
        
        isPlayingRef.current = false;
    };

    const endInterview = async () => {
        try {
            setStatus('ending');
            if (cameraStreamRef.current) {
                cameraStreamRef.current.getTracks().forEach((t) => t.stop());
                cameraStreamRef.current = null;
            }
            if (mediaRecorderRef.current && isRecording) {
                mediaRecorderRef.current.stop();
                setIsRecording(false);

                // Wait for recording to finalize
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Upload recording
                await uploadRecording();
            }

            // Close WebSocket
            if (wsRef.current) {
                wsRef.current.close();
            }

            // Mark interview as complete
            await fetch(`${API_BASE_URL}/api/ai-interview/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    session_id: sessionId,
                    job_id: jobId,
                    email: email
                })
            });

            setStatus('complete');

            // Redirect after 3 seconds
            setTimeout(() => {
                navigate('/');
            }, 3000);

        } catch (err: any) {
            console.error('Error ending interview:', err);
            setError('Error ending interview: ' + err.message);
        }
    };

    const uploadRecording = async () => {
        try {
            if (recordedChunksRef.current.length === 0) {
                console.warn('No recording data to upload');
                return;
            }

            const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
            const formData = new FormData();
            formData.append('file', blob, `interview_${sessionId}.webm`);
            formData.append('session_id', sessionId || '');

            const response = await fetch(`${API_BASE_URL}/api/ai-interview/save-recording`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to upload recording');
            }

            console.log('✅ Recording uploaded successfully');
        } catch (err) {
            console.error('Error uploading recording:', err);
        }
    };

    const cleanup = () => {
        if (cameraStreamRef.current) {
            cameraStreamRef.current.getTracks().forEach((t) => t.stop());
            cameraStreamRef.current = null;
        }
        if (wsRef.current) {
            wsRef.current.close();
        }
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
    };

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    if (status === 'error') {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
            }}>
                <div style={{
                    background: 'white',
                    borderRadius: '20px',
                    padding: '40px',
                    maxWidth: '500px',
                    width: '100%',
                    textAlign: 'center',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                }}>
                    <div style={{ fontSize: '64px', marginBottom: '20px' }}>
                        {error?.includes('already completed') ? '🔒' : '❌'}
                    </div>
                    <h2 style={{ color: '#dc2626', marginBottom: '16px', fontSize: '24px', fontWeight: '700' }}>
                        {error?.includes('already completed') ? 'Interview Already Completed' : 'Interview Error'}
                    </h2>
                    <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '16px' }}>
                        {error || 'An unexpected error occurred'}
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '14px 28px',
                            fontSize: '16px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)'
                        }}
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    if (status === 'complete') {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
            }}>
                <div style={{
                    background: 'white',
                    borderRadius: '20px',
                    padding: '40px',
                    maxWidth: '500px',
                    width: '100%',
                    textAlign: 'center',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                }}>
                    <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
                    <h2 style={{ color: '#059669', marginBottom: '16px', fontSize: '24px', fontWeight: '700' }}>
                        Interview Complete!
                    </h2>
                    <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '16px' }}>
                        Thank you for completing the AI interview. Your responses have been recorded and will be reviewed by the hiring team.
                    </p>
                    <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                        Redirecting to home page in 3 seconds...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            height: '100vh',
            minHeight: '100vh',
            maxHeight: '100vh',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header - fixed */}
            <div style={{
                flexShrink: 0,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '24px 32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px'
                    }}>
                        🤖
                    </div>
                    <div>
                        <h1 style={{ margin: 0, color: 'white', fontSize: '24px', fontWeight: '700' }}>
                            AI Interview
                        </h1>
                        <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                            {status === 'initializing' && 'Initializing...'}
                            {status === 'connecting' && 'Connecting...'}
                            {status === 'active' && isRecording && '🔴 Recording'}
                            {status === 'ending' && 'Ending interview...'}
                        </p>
                    </div>
                </div>
                {status === 'active' && (
                    <button
                        onClick={endInterview}
                        style={{
                            background: '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '12px 24px',
                            fontSize: '16px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#b91c1c';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#dc2626';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        End Interview
                    </button>
                )}
            </div>

            {screenShareStopped && (status === 'connecting' || status === 'active') && (
                <div style={{
                    flexShrink: 0,
                    background: '#fef3c7',
                    borderBottom: '2px solid #f59e0b',
                    padding: '12px 32px',
                    textAlign: 'center',
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#92400e'
                }}>
                    ⚠️ You stopped screen sharing. Please keep sharing until you end the interview.
                </div>
            )}

            {/* Main Content - fills remaining space, no page scroll */}
            <div style={{
                flex: 1,
                minHeight: 0,
                display: 'flex',
                padding: '32px',
                gap: '32px',
                overflow: 'hidden',
                alignSelf: 'stretch'
            }}>
                {/* Transcript Panel - only scrollable area */}
                <div style={{
                    flex: 1,
                    minWidth: 0,
                    minHeight: 0,
                    background: 'white',
                    borderRadius: '20px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                    overflow: 'hidden'
                }}>
                    <h3 style={{
                        margin: '0 0 20px 0',
                        flexShrink: 0,
                        fontSize: '20px',
                        fontWeight: '700',
                        color: '#1e293b',
                        borderBottom: '2px solid #e2e8f0',
                        paddingBottom: '12px'
                    }}>
                        📝 Interview Transcript
                    </h3>
                    <div style={{
                        flex: 1,
                        minHeight: 0,
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px'
                    }}>
                        {transcript.length === 0 && (
                            <div style={{
                                textAlign: 'center',
                                color: '#9ca3af',
                                padding: '40px',
                                fontSize: '15px'
                            }}>
                                {status === 'active' 
                                    ? 'The interview will begin shortly. Please speak clearly when prompted.'
                                    : 'Initializing interview...'}
                            </div>
                        )}
                        {transcript.map((msg, idx) => (
                            <div key={idx} style={{
                                display: 'flex',
                                gap: '12px',
                                alignItems: 'flex-start',
                                padding: '12px',
                                background: msg.role === 'assistant' ? 'linear-gradient(to right, #f0f7ff, #e0f2fe)' : 'linear-gradient(to right, #f9fafb, #f3f4f6)',
                                borderRadius: '12px',
                                borderLeft: `4px solid ${msg.role === 'assistant' ? '#667eea' : '#10b981'}`
                            }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    background: msg.role === 'assistant' ? '#667eea' : '#10b981',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '16px',
                                    flexShrink: 0
                                }}>
                                    {msg.role === 'assistant' ? '🤖' : '👤'}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: '12px',
                                        color: '#6b7280',
                                        marginBottom: '4px',
                                        fontWeight: '600'
                                    }}>
                                        {msg.role === 'assistant' ? 'AI Interviewer' : 'You'} • {formatTime(msg.timestamp)}
                                    </div>
                                    <div style={{
                                        fontSize: '15px',
                                        color: '#1e293b',
                                        lineHeight: '1.6',
                                        wordWrap: 'break-word'
                                    }}>
                                        {msg.text}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={transcriptEndRef} />
                    </div>
                </div>

                {/* Info Panel - fixed; camera, status, tips */}
                <div style={{
                    width: '320px',
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '24px',
                    overflow: 'hidden'
                }}>
                    {/* Live camera self-view - flexShrink 0 so it never collapses */}
                    {(status === 'connecting' || status === 'active') && cameraReady && cameraStreamRef.current && (
                        <div style={{
                            flexShrink: 0,
                            background: 'white',
                            borderRadius: '20px',
                            padding: '16px',
                            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                            overflow: 'hidden'
                        }}>
                            <h4 style={{
                                margin: '0 0 12px 0',
                                fontSize: '14px',
                                fontWeight: '700',
                                color: '#1e293b'
                            }}>
                                📹 You
                            </h4>
                            <div style={{
                                position: 'relative',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                background: '#111',
                                width: '100%',
                                height: '180px',
                                minHeight: '180px'
                            }}>
                                <video
                                    ref={cameraVideoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        transform: 'scaleX(-1)'
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Interview Status - compact */}
                    <div style={{
                        flexShrink: 0,
                        background: 'white',
                        borderRadius: '16px',
                        padding: '12px 16px',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
                    }}>
                        <h4 style={{
                            margin: '0 0 8px 0',
                            fontSize: '13px',
                            fontWeight: '700',
                            color: '#1e293b'
                        }}>
                            Interview Status
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 10px',
                                background: status === 'active' ? '#d1fae5' : '#e0f2fe',
                                borderRadius: '8px'
                            }}>
                                <div style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: status === 'active' ? '#10b981' : '#3b82f6'
                                }} />
                                <span style={{
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: status === 'active' ? '#065f46' : '#1e40af'
                                }}>
                                    {status === 'initializing' && 'Initializing'}
                                    {status === 'connecting' && 'Connecting'}
                                    {status === 'active' && 'In Progress'}
                                    {status === 'ending' && 'Ending'}
                                </span>
                            </div>
                            {isRecording && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 10px',
                                    background: '#fee2e2',
                                    borderRadius: '8px'
                                }}>
                                    <div style={{
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        background: '#dc2626',
                                        animation: 'pulse 2s infinite'
                                    }} />
                                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#991b1b' }}>
                                        Recording
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Interview Tips - scrollable */}
                    <div style={{
                        flex: 1,
                        minHeight: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'white',
                        borderRadius: '20px',
                        padding: '24px',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                        overflow: 'hidden'
                    }}>
                        <h4 style={{
                            margin: '0 0 12px 0',
                            flexShrink: 0,
                            fontSize: '16px',
                            fontWeight: '700',
                            color: '#1e293b'
                        }}>
                            💡 Interview Tips
                        </h4>
                        <div style={{
                            flex: 1,
                            minHeight: 0,
                            overflowY: 'auto'
                        }}>
                            <ul style={{
                                margin: 0,
                                padding: '0 0 0 20px',
                                fontSize: '14px',
                                color: '#6b7280',
                                lineHeight: '1.8'
                            }}>
                                <li>Speak clearly and at a normal pace</li>
                                <li>Wait for the AI to finish before responding</li>
                                <li>Be concise but thorough in your answers</li>
                                <li>Stay in a quiet environment</li>
                                <li>Answer honestly based on your experience</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
}
