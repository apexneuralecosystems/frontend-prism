import { useState } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { API_ENDPOINTS } from "../config/api";

interface DemoRequestFormData {
  name: string;
  email: string;
  countryCode: string;
  phone: string;
  companyName: string;
  position: string;
  date: Date | undefined;
  time: string;
  comments: string;
}

interface DemoRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Common country codes
const countryCodes = [
  { value: "+1", label: "+1 (US/Canada)" },
  { value: "+44", label: "+44 (UK)" },
  { value: "+91", label: "+91 (India)" },
  { value: "+61", label: "+61 (Australia)" },
  { value: "+49", label: "+49 (Germany)" },
  { value: "+33", label: "+33 (France)" },
  { value: "+81", label: "+81 (Japan)" },
  { value: "+86", label: "+86 (China)" },
  { value: "+971", label: "+971 (UAE)" },
  { value: "+65", label: "+65 (Singapore)" },
  { value: "+27", label: "+27 (South Africa)" },
  { value: "+55", label: "+55 (Brazil)" },
  { value: "+52", label: "+52 (Mexico)" },
  { value: "+34", label: "+34 (Spain)" },
  { value: "+39", label: "+39 (Italy)" },
];

// Time slots
const timeSlots = [
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "1:00 PM",
  "1:30 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
  "4:30 PM",
  "5:00 PM",
  "5:30 PM",
];

// API endpoint for demo requests

export function DemoRequestForm({ open, onOpenChange }: DemoRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [progress, setProgress] = useState(0);

  const form = useForm<DemoRequestFormData>({
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      countryCode: "+1",
      phone: "",
      companyName: "",
      position: "",
      date: undefined,
      time: "",
      comments: "",
    },
  });

  // Reset form and success state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isSuccess) {
      form.reset();
      setIsSuccess(false);
    }
    onOpenChange(newOpen);
  };


  const onSubmit = async (data: DemoRequestFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: data.name,
        email: data.email,
        phone: `${data.countryCode} ${data.phone}`,
        companyName: data.companyName,
        position: data.position,
        date: data.date ? format(data.date, "yyyy-MM-dd") : "",
        time: data.time,
        comments: data.comments,
      };

      const response = await fetch(API_ENDPOINTS.DEMO_REQUEST, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setIsSuccess(true);
        setProgress(0);
        // Animate progress bar
        const interval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval);
              return 100;
            }
            return prev + 2;
          });
        }, 100);
        
        setTimeout(() => {
          clearInterval(interval);
          setIsSuccess(false);
          setProgress(0);
          form.reset();
          onOpenChange(false);
          // Redirect to home and scroll to top
          window.location.href = "/";
          window.scrollTo(0, 0);
        }, 5000);
      } else {
        throw new Error("Failed to submit form");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Failed to submit your request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={(e) => {
        // Only close if clicking the overlay, not the content or dropdowns
        if (e.target === e.currentTarget) {
          handleOpenChange(false);
        }
      }}
      onPointerDown={(e) => {
        // Don't close if clicking on dropdowns/popovers
        const target = e.target as HTMLElement;
        if (target.closest('[data-slot="select-content"]') || 
            target.closest('[data-slot="popover-content"]')) {
          e.stopPropagation();
        }
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          maxWidth: '42rem',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          overflowX: 'visible',
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          zIndex: 10000,
          isolation: 'isolate'
        }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-200 pb-4 mb-6">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="w-12 h-12 bg-gradient-to-br from-[#0052FF] to-[#00A3FF] rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white" style={{ fontWeight: 700, fontSize: '1.5rem' }}>A</span>
            </div>
            <h2 className="text-2xl text-[#1E1E1E]" style={{ fontWeight: 700 }}>
              Request for Demo
            </h2>
          </div>
        </div>

        {isSuccess ? (
          <div className="py-20 text-center">
            <div className="mb-8 flex justify-center">
              <div 
                className="bg-gradient-to-br from-[#0052FF] to-[#00A3FF] rounded-full flex items-center justify-center shadow-xl"
                style={{
                  width: '96px',
                  height: '96px',
                  minWidth: '96px',
                  minHeight: '96px'
                }}
              >
                <svg
                  className="text-white"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h3 className="text-3xl font-bold text-[#1E1E1E] mb-4">
              Demo Placed!
            </h3>
            <div className="space-y-2 mb-8">
              <p className="text-lg text-[#4A5568]">
                Your demo request has been submitted successfully.
              </p>
              <p className="text-base text-[#718096]">
                We'll get back to you soon. Redirecting to home page...
              </p>
            </div>
            <div className="flex justify-center">
              <div className="w-64 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#0052FF] to-[#00A3FF] rounded-full transition-all duration-100 ease-linear"
                  style={{
                    width: `${progress}%`
                  }}
                ></div>
              </div>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                rules={{ required: "Name is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#1E1E1E]" style={{ fontWeight: 600 }}>
                      Name *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your full name"
                        className="border-gray-300 focus:border-[#0052FF] focus:ring-2 focus:ring-[#0052FF] transition-all duration-200 hover:border-[#0052FF]/50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                rules={{
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#1E1E1E]" style={{ fontWeight: 600 }}>
                      Email *
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        className="border-gray-300 focus:border-[#0052FF] focus:ring-2 focus:ring-[#0052FF] transition-all duration-200 hover:border-[#0052FF]/50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone with Country Code */}
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="countryCode"
                  rules={{ required: "Country code is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#1E1E1E]" style={{ fontWeight: 600 }}>
                        Country Code *
                      </FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#0052FF] focus:ring-2 focus:ring-[#0052FF] focus:outline-none transition-all duration-200 hover:border-[#0052FF]/50 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22%3E%3C/polyline%3E%3C/svg%3E')] bg-[length:1.5em_1.5em] bg-[right_0.5rem_center] bg-no-repeat pr-10"
                        >
                          <option value="">Select code</option>
                          {countryCodes.map((code) => (
                            <option key={code.value} value={code.value}>
                              {code.label}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  rules={{ required: "Phone number is required" }}
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="text-[#1E1E1E]" style={{ fontWeight: 600 }}>
                        Phone Number *
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="Enter your phone number"
                          className="border-gray-300 focus:border-[#0052FF] focus:ring-2 focus:ring-[#0052FF] transition-all duration-200 hover:border-[#0052FF]/50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Company Name */}
              <FormField
                control={form.control}
                name="companyName"
                rules={{ required: "Company name is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#1E1E1E]" style={{ fontWeight: 600 }}>
                      Company Name *
                    </FormLabel>
                    <FormControl>
                        <Input
                          placeholder="Enter your company name"
                          className="border-gray-300 focus:border-[#0052FF] focus:ring-2 focus:ring-[#0052FF] transition-all duration-200 hover:border-[#0052FF]/50"
                          {...field}
                        />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Position */}
              <FormField
                control={form.control}
                name="position"
                rules={{ required: "Position is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#1E1E1E]" style={{ fontWeight: 600 }}>
                      Position *
                    </FormLabel>
                    <FormControl>
                        <Input
                          placeholder="Enter your position in the company"
                          className="border-gray-300 focus:border-[#0052FF] focus:ring-2 focus:ring-[#0052FF] transition-all duration-200 hover:border-[#0052FF]/50"
                          {...field}
                        />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  rules={{ required: "Date is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#1E1E1E]" style={{ fontWeight: 600 }}>
                        Preferred Date *
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          className="border-gray-300 focus:border-[#0052FF] focus:ring-2 focus:ring-[#0052FF] cursor-pointer transition-all duration-200 hover:border-[#0052FF]/50"
                          style={{
                            cursor: 'pointer',
                            paddingRight: '2.5rem'
                          }}
                          min={new Date().toISOString().split('T')[0]}
                          value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                          onChange={(e) => {
                            const date = e.target.value ? new Date(e.target.value) : undefined;
                            field.onChange(date);
                          }}
                          onClick={(e) => {
                            // Ensure calendar opens on click
                            (e.target as HTMLInputElement).showPicker?.();
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="time"
                  rules={{ required: "Time is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#1E1E1E]" style={{ fontWeight: 600 }}>
                        Preferred Time *
                      </FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#0052FF] focus:ring-2 focus:ring-[#0052FF] focus:outline-none transition-all duration-200 hover:border-[#0052FF]/50 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22%3E%3C/polyline%3E%3C/svg%3E')] bg-[length:1.5em_1.5em] bg-[right_0.5rem_center] bg-no-repeat pr-10"
                        >
                          <option value="">Select time</option>
                          {timeSlots.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Comments */}
              <FormField
                control={form.control}
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#1E1E1E]" style={{ fontWeight: 600 }}>
                      Additional Information
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about your requirements or any specific information you'd like to share..."
                        className="border-gray-300 focus:border-[#0052FF] focus:ring-2 focus:ring-[#0052FF] min-h-24 transition-all duration-200 hover:border-[#0052FF]/50 resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="border-gray-300 text-[#4A5568] hover:bg-gray-50 transition-all duration-200 px-6"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#0052FF] hover:bg-[#0046DD] text-white transition-all duration-200 shadow-md hover:shadow-lg px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
        
        {/* Close Button */}
        <button
          onClick={() => handleOpenChange(false)}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.5rem',
            color: '#4A5568',
            opacity: 0.7,
            padding: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
        >
          ×
        </button>
      </div>
    </div>
  );
}

