import React, { useState, useEffect } from 'react';
import {
    Users, Plus, X, Edit, Trash2, CheckCircle, AlertCircle,
    UserPlus, UserMinus, Save, LogOut, Building2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authenticatedFetch, clearAuthAndRedirect } from '../utils/auth';
import { API_ENDPOINTS } from '../config/api';

// --- Types ---

interface TeamMember {
    name: string;
    email: string;
    calendar_link: string;
}

interface Team {
    team_id: string;
    team_name: string;
    members: TeamMember[];
}

interface OrganizationData {
    company_name: string;
    organization_email: string;
    teams: Team[];
}

// --- Helper Components ---

const TeamCard = ({
    team,
    onEdit,
    onDelete
}: {
    team: Team;
    onEdit: (team: Team) => void;
    onDelete: (teamId: string) => void;
}) => {
    return (
        <div style={{ 
            background: '#ffffff', 
            borderRadius: '12px', 
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', 
            padding: '24px',
            transition: 'all 0.2s ease-in-out',
            transform: 'translateY(0)',
            border: '1px solid #e2e8f0'
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.1)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                        background: 'linear-gradient(to bottom right, #60a5fa, #3b82f6)', 
                        borderRadius: '10px', 
                        padding: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Users style={{ width: '20px', height: '20px', color: '#ffffff' }} />
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: 0 }}>{team.team_name}</h3>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => onEdit(team)}
                        style={{ 
                            padding: '8px', 
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
                        title="Edit team"
                    >
                        <Edit style={{ width: '16px', height: '16px', color: '#475569' }} />
                    </button>
                    <button
                        onClick={() => onDelete(team.team_id)}
                        style={{ 
                            padding: '8px', 
                            background: '#fef2f2',
                            border: '1px solid #fee2e2',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#fef2f2'}
                        title="Delete team"
                    >
                        <Trash2 style={{ width: '16px', height: '16px', color: '#ef4444' }} />
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {team.members.map((member, index) => (
                    <div key={index} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        padding: '16px', 
                        background: 'linear-gradient(to bottom right, #f8fafc, #f1f5f9)',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(to bottom right, #e0f2fe, #dbeafe)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(to bottom right, #f8fafc, #f1f5f9)'}>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: '500', color: '#1e293b', margin: '0 0 4px 0' }}>{member.name}</p>
                            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>{member.email}</p>
                        </div>
                        <a
                            href={member.calendar_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ 
                                color: '#2563eb',
                                fontSize: '14px',
                                fontWeight: '500',
                                textDecoration: 'none',
                                padding: '6px 12px',
                                background: '#dbeafe',
                                borderRadius: '6px',
                                transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#2563eb';
                                e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#dbeafe';
                                e.currentTarget.style.color = '#2563eb';
                            }}
                        >
                            Calendar
                        </a>
                    </div>
                ))}
                {team.members.length === 0 && (
                    <p style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '20px', margin: 0 }}>No members added yet</p>
                )}
            </div>
        </div>
    );
};

const TeamFormModal = ({
    isOpen,
    onClose,
    onSave,
    editingTeam,
    loading
}: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (team: Team) => void;
    editingTeam?: Team | null;
    loading: boolean;
}) => {
    const [teamName, setTeamName] = useState('');
    const [members, setMembers] = useState<TeamMember[]>([]);

    useEffect(() => {
        if (editingTeam) {
            setTeamName(editingTeam.team_name);
            setMembers([...editingTeam.members]);
        } else {
            setTeamName('');
            setMembers([]);
        }
    }, [editingTeam, isOpen]);

    const addMember = () => {
        setMembers([...members, { name: '', email: '', calendar_link: '' }]);
    };

    const removeMember = (index: number) => {
        setMembers(members.filter((_, i) => i !== index));
    };

    const updateMember = (index: number, field: keyof TeamMember, value: string) => {
        const updatedMembers = [...members];
        updatedMembers[index][field] = value;
        setMembers(updatedMembers);
    };

    const handleSave = () => {
        if (!teamName.trim()) {
            alert('Team name is required');
            return;
        }

        // Filter out empty members
        const validMembers = members.filter(member =>
            member.name.trim() || member.email.trim() || member.calendar_link.trim()
        );

        const team: Team = {
            team_id: editingTeam?.team_id || `team_${Date.now()}`,
            team_name: teamName.trim(),
            members: validMembers
        };

        onSave(team);
    };

    if (!isOpen) return null;

    return (
        <div style={{ 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(0, 0, 0, 0.5)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '16px', 
            zIndex: 50,
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{ 
                background: '#ffffff', 
                borderRadius: '16px', 
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)', 
                maxWidth: '800px', 
                width: '100%', 
                maxHeight: '90vh', 
                overflowY: 'auto',
                animation: 'slideIn 0.2s ease-out'
            }}>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '24px', 
                    borderBottom: '1px solid #e2e8f0',
                    background: 'linear-gradient(to right, #6366f1, #8b5cf6)'
                }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#ffffff', margin: 0 }}>
                        {editingTeam ? 'Edit Team' : 'Create New Team'}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{ 
                            padding: '8px', 
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                    >
                        <X style={{ width: '20px', height: '20px', color: '#ffffff' }} />
                    </button>
                </div>

                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Team Name */}
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#475569', marginBottom: '8px' }}>
                            Team Name *
                        </label>
                        <input
                            type="text"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            style={{ 
                                width: '100%', 
                                padding: '12px 16px', 
                                border: '1px solid #cbd5e1', 
                                borderRadius: '10px',
                                fontSize: '14px',
                                outline: 'none',
                                transition: 'all 0.15s ease',
                                boxSizing: 'border-box'
                            }}
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = '#2563eb';
                                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = '#cbd5e1';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                            placeholder="Enter team name"
                        />
                    </div>

                    {/* Team Members */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#475569' }}>
                                Team Members
                            </label>
                            <button
                                onClick={addMember}
                                style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '8px', 
                                    padding: '8px 16px', 
                                    fontSize: '14px', 
                                    background: 'linear-gradient(to bottom right, #2563eb, #1d4ed8)',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    transition: 'all 0.15s ease',
                                    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
                                    transform: 'translateY(0)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(37, 99, 235, 0.3)';
                                }}
                            >
                                <UserPlus style={{ width: '16px', height: '16px' }} />
                                Add Member
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {members.map((member, index) => (
                                <div key={index} style={{ 
                                    border: '1px solid #e2e8f0', 
                                    borderRadius: '12px', 
                                    padding: '20px', 
                                    position: 'relative',
                                    background: 'linear-gradient(to bottom right, #f8fafc, #f1f5f9)',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                                }}>
                                    <button
                                        onClick={() => removeMember(index)}
                                        style={{ 
                                            position: 'absolute', 
                                            top: '12px', 
                                            right: '12px', 
                                            padding: '6px',
                                            background: '#fef2f2',
                                            border: '1px solid #fee2e2',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = '#fef2f2'}
                                        title="Remove member"
                                    >
                                        <UserMinus style={{ width: '16px', height: '16px', color: '#ef4444' }} />
                                    </button>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', paddingRight: '40px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#64748b', marginBottom: '6px' }}>
                                                Name
                                            </label>
                                            <input
                                                type="text"
                                                value={member.name}
                                                onChange={(e) => updateMember(index, 'name', e.target.value)}
                                                style={{ 
                                                    width: '100%', 
                                                    padding: '8px 12px', 
                                                    fontSize: '14px', 
                                                    border: '1px solid #cbd5e1', 
                                                    borderRadius: '8px',
                                                    outline: 'none',
                                                    transition: 'all 0.15s ease',
                                                    boxSizing: 'border-box',
                                                    background: '#ffffff'
                                                }}
                                                onFocus={(e) => {
                                                    e.currentTarget.style.borderColor = '#2563eb';
                                                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(37, 99, 235, 0.1)';
                                                }}
                                                onBlur={(e) => {
                                                    e.currentTarget.style.borderColor = '#cbd5e1';
                                                    e.currentTarget.style.boxShadow = 'none';
                                                }}
                                                placeholder="Employee name"
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#64748b', marginBottom: '6px' }}>
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={member.email}
                                                onChange={(e) => updateMember(index, 'email', e.target.value)}
                                                style={{ 
                                                    width: '100%', 
                                                    padding: '8px 12px', 
                                                    fontSize: '14px', 
                                                    border: '1px solid #cbd5e1', 
                                                    borderRadius: '8px',
                                                    outline: 'none',
                                                    transition: 'all 0.15s ease',
                                                    boxSizing: 'border-box',
                                                    background: '#ffffff'
                                                }}
                                                onFocus={(e) => {
                                                    e.currentTarget.style.borderColor = '#2563eb';
                                                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(37, 99, 235, 0.1)';
                                                }}
                                                onBlur={(e) => {
                                                    e.currentTarget.style.borderColor = '#cbd5e1';
                                                    e.currentTarget.style.boxShadow = 'none';
                                                }}
                                                placeholder="employee@email.com"
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#64748b', marginBottom: '6px' }}>
                                                Calendar Link
                                            </label>
                                            <input
                                                type="url"
                                                value={member.calendar_link}
                                                onChange={(e) => updateMember(index, 'calendar_link', e.target.value)}
                                                style={{ 
                                                    width: '100%', 
                                                    padding: '8px 12px', 
                                                    fontSize: '14px', 
                                                    border: '1px solid #cbd5e1', 
                                                    borderRadius: '8px',
                                                    outline: 'none',
                                                    transition: 'all 0.15s ease',
                                                    boxSizing: 'border-box',
                                                    background: '#ffffff'
                                                }}
                                                onFocus={(e) => {
                                                    e.currentTarget.style.borderColor = '#2563eb';
                                                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(37, 99, 235, 0.1)';
                                                }}
                                                onBlur={(e) => {
                                                    e.currentTarget.style.borderColor = '#cbd5e1';
                                                    e.currentTarget.style.boxShadow = 'none';
                                                }}
                                                placeholder="https://calendar.google.com/..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {members.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                                    <Users style={{ width: '48px', height: '48px', margin: '0 auto 8px', opacity: 0.5 }} />
                                    <p style={{ margin: '0 0 4px 0', fontSize: '14px' }}>No team members added yet</p>
                                    <p style={{ fontSize: '12px', margin: 0 }}>Click "Add Member" to get started</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Instructions */}
                    <div style={{ 
                        background: 'linear-gradient(to bottom right, #dbeafe, #e0e7ff)',
                        border: '1px solid #93c5fd',
                        borderRadius: '12px',
                        padding: '16px'
                    }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#1e40af', margin: '0 0 8px 0' }}>Instructions:</h4>
                        <ul style={{ fontSize: '13px', color: '#1e3a8a', margin: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
                            <li>Fill in the team name and add team members</li>
                            {/* <li>Each member needs a name, email, and calendar link</li> */}
                            <li>You can add or remove members as needed</li>
                            {/* <li>All changes will be saved to your organization data</li> */}
                            <li>Calendar link is the link to the calendar of the employee</li>
                            <li>Enable public access in Google Calendar settings and share the public iCal (ICS) address.</li>
                        </ul>
                    </div>
                </div>

                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'flex-end', 
                    gap: '12px', 
                    padding: '20px 24px', 
                    borderTop: '1px solid #e2e8f0',
                    background: '#f8fafc'
                }}>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        style={{ 
                            padding: '10px 20px',
                            color: '#475569',
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.15s ease',
                            fontWeight: '500',
                            fontSize: '14px',
                            opacity: loading ? 0.5 : 1
                        }}
                        onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#f1f5f9')}
                        onMouseLeave={(e) => !loading && (e.currentTarget.style.background = '#ffffff')}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px', 
                            padding: '10px 24px',
                            background: loading ? '#94a3b8' : 'linear-gradient(to bottom right, #16a34a, #15803d)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            transition: 'all 0.15s ease',
                            fontWeight: '500',
                            fontSize: '14px',
                            boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)',
                            transform: 'translateY(0)'
                        }}
                        onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
                        onMouseLeave={(e) => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
                    >
                        {loading ? (
                            <>
                                <div style={{ 
                                    width: '16px', 
                                    height: '16px', 
                                    border: '2px solid white', 
                                    borderTop: '2px solid transparent', 
                                    borderRadius: '50%', 
                                    animation: 'spin 1s linear infinite' 
                                }}></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save style={{ width: '16px', height: '16px' }} />
                                {editingTeam ? 'Update Team' : 'Create Team'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---

export function OrganizationTeam() {
    const navigate = useNavigate();
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [userData, setUserData] = useState<any>(null);

    useEffect(() => {
        // Check authentication and user type
        const token = localStorage.getItem('access_token');
        const storedUserData = localStorage.getItem('user');

        if (!token) {
            navigate('/');
            return;
        }

        if (storedUserData) {
            const parsedUser = JSON.parse(storedUserData);
            if (parsedUser.user_type !== 'organization') {
                navigate('/');
                return;
            }
            setUserData(parsedUser);
        }

        // Fetch teams data
        fetchTeams();
    }, [navigate]);

    const fetchTeams = async () => {
        try {
            const res = await authenticatedFetch(
                API_ENDPOINTS.ORGANIZATION_TEAMS,
                { method: 'GET' },
                navigate
            );

            if (!res) return;

            if (res.ok) {
                const result = await res.json();
                setTeams(result.teams || []);
                setMessage(null); // Clear any error messages on successful fetch
            } else if (res.status === 401) {
                clearAuthAndRedirect(navigate);
            } else {
                setMessage({ type: 'error', text: 'Failed to load teams data' });
            }
        } catch (err) {
            console.error('Failed to fetch teams:', err);
            setMessage({ type: 'error', text: 'Error loading teams data' });
        } finally {
            setLoading(false);
        }
    };

    const saveTeamsToBackend = async (updatedTeams: Team[]) => {
        setLoading(true);
        setMessage(null);

        try {
            const organizationData: OrganizationData = {
                company_name: userData?.name || '',
                organization_email: userData?.email || '',
                teams: updatedTeams
            };

            const res = await authenticatedFetch(
                API_ENDPOINTS.ORGANIZATION_TEAMS,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(organizationData)
                },
                navigate
            );

            if (!res) return false;

            if (res.ok) {
                setMessage({ type: 'success', text: 'Teams updated successfully!' });
                return true;
            } else {
                setMessage({ type: 'error', text: 'Failed to save teams data' });
                return false;
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Error saving teams data' });
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTeam = () => {
        setEditingTeam(null);
        setModalOpen(true);
    };

    const handleEditTeam = (team: Team) => {
        setEditingTeam(team);
        setModalOpen(true);
    };

    const handleDeleteTeam = async (teamId: string) => {
        if (!confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
            return;
        }

        const updatedTeams = teams.filter(team => team.team_id !== teamId);
        const success = await saveTeamsToBackend(updatedTeams);

        if (success) {
            setTeams(updatedTeams);
        }
    };

    const handleSaveTeam = async (team: Team) => {
        let updatedTeams: Team[];

        if (editingTeam) {
            // Update existing team
            updatedTeams = teams.map(t => t.team_id === team.team_id ? team : t);
        } else {
            // Add new team
            updatedTeams = [...teams, team];
        }

        const success = await saveTeamsToBackend(updatedTeams);

        if (success) {
            setTeams(updatedTeams);
            setModalOpen(false);
            setEditingTeam(null);
        }
    };

    const handleLogout = async () => {
        const refreshToken = localStorage.getItem("refresh_token");

        if (refreshToken) {
            try {
                await fetch(API_ENDPOINTS.AUTH.LOGOUT, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ refresh_token: refreshToken })
                });
            } catch (error) {
                console.error("Logout error:", error);
            }
        }

        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        navigate("/");
    };

    if (loading && teams.length === 0) {
        return (
            <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #f8fafc, #e0f2fe)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                        width: '48px', 
                        height: '48px', 
                        border: '4px solid #2563eb', 
                        borderTop: '4px solid transparent', 
                        borderRadius: '50%', 
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px'
                    }}></div>
                    <p style={{ color: '#475569', fontSize: '16px', fontWeight: '500' }}>Loading teams...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #f8fafc, #e0f2fe)', paddingBottom: '80px' }}>
            {/* Header */}
            <div style={{ 
                background: 'linear-gradient(to right, #6366f1, #8b5cf6)',
                borderBottom: '1px solid #e2e8f0',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}>
                <div style={{ 
                    maxWidth: '1200px', 
                    margin: '0 auto', 
                    padding: '16px 24px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                            background: 'rgba(255, 255, 255, 0.2)', 
                            borderRadius: '10px', 
                            padding: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Building2 style={{ width: '24px', height: '24px', color: '#ffffff' }} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', margin: 0, lineHeight: '1.2' }}>Organization Teams</h1>
                            <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.9)', margin: '2px 0 0 0' }}>Manage your interview teams</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => navigate('/organization-profile')}
                            style={{ 
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 16px',
                                borderRadius: '8px',
                                fontWeight: '500',
                                fontSize: '14px',
                                color: '#ffffff',
                                background: 'rgba(255, 255, 255, 0.15)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                transform: 'translateY(0)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            Profile
                        </button>
                        <button
                            onClick={handleCreateTeam}
                            style={{ 
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 20px',
                                borderRadius: '8px',
                                fontWeight: '500',
                                fontSize: '14px',
                                color: '#ffffff',
                                background: '#2563eb',
                                border: 'none',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
                                transition: 'all 0.15s ease',
                                transform: 'translateY(0)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#1d4ed8';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#2563eb';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.4)';
                            }}
                        >
                            <Plus style={{ width: '16px', height: '16px' }} />
                            Add Team
                        </button>
                        <button
                            onClick={handleLogout}
                            style={{ 
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 16px',
                                borderRadius: '8px',
                                fontWeight: '500',
                                fontSize: '14px',
                                color: '#ffffff',
                                background: '#dc2626',
                                border: 'none',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
                                transition: 'all 0.15s ease',
                                transform: 'translateY(0)'
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
                            <LogOut style={{ width: '16px', height: '16px' }} />
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Message Toast */}
            {message && (
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 24px 0' }}>
                    <div style={{ 
                        padding: '16px 20px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: message.type === 'success' ? 'linear-gradient(to right, #d1fae5, #a7f3d0)' : 'linear-gradient(to right, #fee2e2, #fecaca)',
                        border: `1px solid ${message.type === 'success' ? '#86efac' : '#fca5a5'}`,
                        color: message.type === 'success' ? '#065f46' : '#991b1b',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                        fontWeight: '500',
                        animation: 'slideDown 0.3s ease-out'
                    }}>
                        {message.type === 'success' ? 
                            <CheckCircle style={{ width: '20px', height: '20px', flexShrink: 0 }} /> : 
                            <AlertCircle style={{ width: '20px', height: '20px', flexShrink: 0 }} />
                        }
                        <span style={{ flex: 1 }}>{message.text}</span>
                        <button
                            onClick={() => setMessage(null)}
                            style={{ 
                                padding: '4px',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <X style={{ width: '16px', height: '16px' }} />
                        </button>
                    </div>
                </div>
            )}

            {/* Content */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
                {teams.length === 0 ? (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '80px 20px',
                        background: '#ffffff',
                        borderRadius: '16px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
                    }}>
                        <div style={{ 
                            background: 'linear-gradient(to bottom right, #dbeafe, #e0e7ff)',
                            borderRadius: '20px',
                            width: '120px',
                            height: '120px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px'
                        }}>
                            <Users style={{ width: '64px', height: '64px', color: '#3b82f6' }} />
                        </div>
                        <h3 style={{ fontSize: '24px', fontWeight: '600', color: '#1e293b', margin: '0 0 8px 0' }}>No teams created yet</h3>
                        <p style={{ color: '#64748b', margin: '0 0 32px 0', fontSize: '15px' }}>Create your first team to get started with team management</p>
                        <button
                            onClick={handleCreateTeam}
                            style={{ 
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '10px',
                                background: 'linear-gradient(to bottom right, #2563eb, #1d4ed8)',
                                color: '#ffffff',
                                padding: '14px 28px',
                                borderRadius: '10px',
                                fontWeight: '500',
                                fontSize: '15px',
                                border: 'none',
                                cursor: 'pointer',
                                boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4)',
                                transition: 'all 0.2s ease',
                                transform: 'translateY(0)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-3px)';
                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(37, 99, 235, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 16px rgba(37, 99, 235, 0.4)';
                            }}
                        >
                            <Plus style={{ width: '20px', height: '20px' }} />
                            Create Your First Team
                        </button>
                    </div>
                ) : (
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
                        gap: '24px' 
                    }}>
                        {teams.map((team) => (
                            <TeamCard
                                key={team.team_id}
                                team={team}
                                onEdit={handleEditTeam}
                                onDelete={handleDeleteTeam}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Team Form Modal */}
            <TeamFormModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={handleSaveTeam}
                editingTeam={editingTeam}
                loading={loading}
            />

            {/* Add keyframe animations */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
            `}</style>
        </div>
    );
}
