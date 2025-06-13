import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Calendar, Lock, Shield, ChevronLeft, ArrowRight, KeyRound, Check, X, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Password Strength Meter component
const PasswordStrengthMeter = ({ password }: { password: string }) => {
  const calculateStrength = (password: string) => {
    if (!password) return 0;
    
    let strength = 0;
    // Length check
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (password.length >= 16) strength += 1;
    
    // Character checks
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    return Math.min(strength, 5); // Max strength is 5
  };
  
  const strength = calculateStrength(password);
  
  const getStrengthLabel = () => {
    if (!password) return "";
    if (strength === 0) return "Very Weak";
    if (strength === 1) return "Weak";
    if (strength === 2) return "Fair";
    if (strength === 3) return "Good";
    if (strength === 4) return "Strong";
    return "Very Strong";
  };
  
  const getStrengthColor = () => {
    if (!password) return "#2A2A2A";
    if (strength <= 1) return "#FF4136"; // Red
    if (strength === 2) return "#FF851B"; // Orange
    if (strength === 3) return "#FFDC00"; // Yellow
    if (strength === 4) return "#2ECC40"; // Green
    return "#7FDBFF"; // Blue
  };
  
  // Check requirements
  const hasLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_\-+=<>?/\[\]{}]/.test(password);
  
  return (
    <div className="mt-2">
      {/* Strength meter bar */}
      <div className="w-full h-2 bg-[#1E1E1E] rounded-full overflow-hidden">
        <motion.div
          className="h-full"
          style={{ backgroundColor: getStrengthColor() }}
          initial={{ width: 0 }}
          animate={{ width: `${(strength / 5) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      
      {/* Strength label */}
      <div className="flex justify-between mt-1 text-xs">
        <span className="text-[#D4D5F4]/70">Password Strength</span>
        <span style={{ color: getStrengthColor() }}>{getStrengthLabel()}</span>
      </div>
      
      {/* Requirements checklist */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1">
          {hasLength ? (
            <Check className="w-3 h-3 text-green-500" />
          ) : (
            <X className="w-3 h-3 text-red-500" />
          )}
          <span className={hasLength ? "text-green-500" : "text-[#D4D5F4]/70"}>
            At least 8 characters
          </span>
        </div>
        <div className="flex items-center gap-1">
          {hasUppercase ? (
            <Check className="w-3 h-3 text-green-500" />
          ) : (
            <X className="w-3 h-3 text-red-500" />
          )}
          <span className={hasUppercase ? "text-green-500" : "text-[#D4D5F4]/70"}>
            Uppercase letter
          </span>
        </div>
        <div className="flex items-center gap-1">
          {hasLowercase ? (
            <Check className="w-3 h-3 text-green-500" />
          ) : (
            <X className="w-3 h-3 text-red-500" />
          )}
          <span className={hasLowercase ? "text-green-500" : "text-[#D4D5F4]/70"}>
            Lowercase letter
          </span>
        </div>
        <div className="flex items-center gap-1">
          {hasNumber ? (
            <Check className="w-3 h-3 text-green-500" />
          ) : (
            <X className="w-3 h-3 text-red-500" />
          )}
          <span className={hasNumber ? "text-green-500" : "text-[#D4D5F4]/70"}>
            Number
          </span>
        </div>
        <div className="flex items-center gap-1">
          {hasSpecial ? (
            <Check className="w-3 h-3 text-green-500" />
          ) : (
            <X className="w-3 h-3 text-red-500" />
          )}
          <span className={hasSpecial ? "text-green-500" : "text-[#D4D5F4]/70"}>
            Special character
          </span>
        </div>
      </div>
    </div>
  );
};

// Custom input component
const Input = ({ 
  id, 
  name, 
  type = "text", 
  value, 
  onChange, 
  placeholder, 
  required = false,
  error = "",
  icon: Icon,
  disabled = false
}: {
  id: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  required?: boolean;
  error?: string;
  icon: React.ElementType;
  disabled?: boolean;
}) => {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-gray-300 flex items-center gap-2">
        <Icon className="w-4 h-4 text-purple-500" />
        {placeholder}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full bg-[#1E1E1E] border ${error ? 'border-red-500' : 'border-[#2A2A2A]'} text-white focus:border-purple-500 focus:ring-purple-500 h-12 rounded-lg px-4`}
        />
        {error && (
          <p className="text-red-500 text-sm mt-1">{error}</p>
        )}
      </div>
    </div>
  );
};

// Custom hook for particle system (copied from Login.tsx)
const useParticles = (count = 50) => {
  const [particles, setParticles] = useState<{ x: number; y: number; size: number; speed: number; color: string; opacity: number }[]>([]);
  
  useEffect(() => {
    const colors = ['#D4D5F4', '#8A8DBA', '#5D5F8D', '#FFFFFF'];
    const newParticles = Array.from({ length: count }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 5 + 1,
      speed: Math.random() * 0.3 + 0.1,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: Math.random() * 0.5 + 0.1
    }));
    
    setParticles(newParticles);
    
    const interval = setInterval(() => {
      setParticles(prev => prev.map(p => ({
        ...p,
        y: p.y - p.speed > 0 ? p.y - p.speed : 100,
        opacity: p.y < 10 ? p.y / 10 : p.opacity
      })));
    }, 50);
    
    return () => clearInterval(interval);
  }, [count]);
  
  return particles;
};

// Custom Alert Modal component
const AlertModal = ({ isOpen, message, onClose }: { isOpen: boolean; message: string; onClose: () => void }) => {
  const modalRef = React.useRef<HTMLDivElement>(null);
  const [isClosing, setIsClosing] = useState(false);

  // Enhanced useEffect for safer DOM operations
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      document.body.style.overflow = 'hidden';
      
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleSafeClose();
        }
      };
      
      window.addEventListener('keydown', handleEsc);
      
      return () => {
        window.removeEventListener('keydown', handleEsc);
        if (!isClosing) {
          document.body.style.overflow = 'unset';
        }
      };
    }
  }, [isOpen]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);
  
  // Safer closing mechanism with animation
  const handleSafeClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    
    if (modalRef.current) {
      modalRef.current.style.opacity = '0';
      setTimeout(() => {
        setIsClosing(false);
        onClose();
        document.body.style.overflow = 'unset';
      }, 300);
    } else {
      setIsClosing(false);
      onClose();
      document.body.style.overflow = 'unset';
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity duration-300"
      ref={modalRef}
      key={`alert-modal-${Date.now()}`} // Ensure fresh mounting
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gradient-to-br from-[#0a0c11] via-[#050c17] to-[#0a0c11] rounded-xl p-6 max-w-md w-full border border-[#D4D5F4]/10 shadow-xl"
      >
        <div className="flex items-start mb-4">
          <div className="bg-orange-500/10 p-2 rounded-full">
            <AlertCircle className="w-6 h-6 text-orange-500" />
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-medium text-white">Notice</h3>
            <p className="mt-1 text-gray-300">{message}</p>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleSafeClose}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 rounded-lg text-sm hover:opacity-90 transition-opacity"
          >
            OK
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const SignUp: React.FC = () => {
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(33);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  
  // Alert modal state
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  
  // Rate limit state
  const [otpRateLimited, setOtpRateLimited] = useState(false);
  const [otpRateLimitEnd, setOtpRateLimitEnd] = useState(0);
  const [otpTimeRemaining, setOtpTimeRemaining] = useState("");
  const [verifyAttemptsRemaining, setVerifyAttemptsRemaining] = useState(4);
  const [verifyRateLimited, setVerifyRateLimited] = useState(false);
  const [verifyRateLimitEnd, setVerifyRateLimitEnd] = useState(0);
  const [verifyTimeRemaining, setVerifyTimeRemaining] = useState("");
  
  // Form rate limit state
  const [formRateLimited, setFormRateLimited] = useState(false);
  const [formRateLimitEnd, setFormRateLimitEnd] = useState(0);
  const [formTimeRemaining, setFormTimeRemaining] = useState("");
  
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const particles = useParticles(80);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    dob: "",
    secretWord: "",
    password: "",
    confirmPassword: "",
    otp: ""
  });

  useEffect(() => {
    // Check if user is authenticated with Discord and if they already have a wallet
    const checkAuthAndWallet = async () => {
      try {
        // First check the session
        const sessionResponse = await fetch("/api/auth/check-session");
        const sessionData = await sessionResponse.json();
        
        if (sessionData.authenticated) {
          // If fully authenticated, redirect to dashboard
          navigate("/dashboard");
          return;
        } else if (!sessionData.discord_authenticated) {
          // If not authenticated with Discord, redirect to Discord auth
          navigate("/dashboardselect");
          return;
        }
        
        // User is logged in with Discord but not wallet yet - check if they already have a wallet
        const walletResponse = await fetch("/api/signup/check-existing-wallet");
        const walletData = await walletResponse.json();
        
        if (walletResponse.ok && walletData.has_wallet) {
          // If user already has a wallet, show a message and redirect to dashboard
          setAlertMessage(walletData.message || "You already have a Cryptonel wallet. Redirecting to dashboard...");
          setAlertOpen(true);
          
          // Redirect after a short delay to ensure message is seen
          setTimeout(() => {
            navigate("/dashboard");
          }, 2000);
          return;
        }
      } catch (error) {
        console.error("Error checking authentication or wallet:", error);
        navigate("/dashboardselect");
      }
    };
    
    checkAuthAndWallet();
    
    // Check for stored rate limits in localStorage
    const storedOtpSendLimit = localStorage.getItem("otpSendRateLimit");
    if (storedOtpSendLimit) {
      const { end } = JSON.parse(storedOtpSendLimit);
      const now = Date.now();
      if (end > now) {
        setOtpRateLimited(true);
        setOtpRateLimitEnd(end);
        startOtpCountdown(end);
      } else {
        // Clear expired rate limit
        localStorage.removeItem("otpSendRateLimit");
      }
    }
    
    const storedVerifyLimit = localStorage.getItem("otpVerifyRateLimit");
    if (storedVerifyLimit) {
      const { end, attempts } = JSON.parse(storedVerifyLimit);
      const now = Date.now();
      if (end > now) {
        setVerifyRateLimited(true);
        setVerifyRateLimitEnd(end);
        startVerifyCountdown(end);
      } else if (attempts < 4) {
        setVerifyAttemptsRemaining(attempts);
      } else {
        // Clear expired rate limit
        localStorage.removeItem("otpVerifyRateLimit");
      }
    }
    
    // Check for form rate limits
    const storedFormLimit = localStorage.getItem("signupFormRateLimit");
    if (storedFormLimit) {
      const { end } = JSON.parse(storedFormLimit);
      const now = Date.now();
      if (end > now) {
        setFormRateLimited(true);
        setFormRateLimitEnd(end);
        startFormCountdown(end);
      } else {
        // Clear expired rate limit
        localStorage.removeItem("signupFormRateLimit");
      }
    }
    
    // Cleanup timers
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, [navigate]);

  useEffect(() => {
    // Update progress based on current step (33% per step)
    setProgress(Math.round(step * 33.33));
  }, [step]);

  // Format time remaining
  const formatTimeRemaining = (milliseconds: number) => {
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };
  
  // Start countdown for OTP send rate limit
  const startOtpCountdown = (endTime: number) => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    
    const updateTimer = () => {
      const now = Date.now();
      const remaining = endTime - now;
      
      if (remaining <= 0) {
        // Rate limit expired
        clearInterval(countdownTimerRef.current!);
        setOtpRateLimited(false);
        setOtpTimeRemaining("");
        localStorage.removeItem("otpSendRateLimit");
      } else {
        setOtpTimeRemaining(formatTimeRemaining(remaining));
      }
    };
    
    // Initial update
    updateTimer();
    
    // Update every second
    countdownTimerRef.current = setInterval(updateTimer, 1000);
  };
  
  // Start countdown for verify rate limit
  const startVerifyCountdown = (endTime: number) => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    
    const updateTimer = () => {
      const now = Date.now();
      const remaining = endTime - now;
      
      if (remaining <= 0) {
        // Rate limit expired
        clearInterval(countdownTimerRef.current!);
        setVerifyRateLimited(false);
        setVerifyTimeRemaining("");
        localStorage.removeItem("otpVerifyRateLimit");
      } else {
        setVerifyTimeRemaining(formatTimeRemaining(remaining));
      }
    };
    
    // Initial update
    updateTimer();
    
    // Update every second
    countdownTimerRef.current = setInterval(updateTimer, 1000);
  };

  // Start countdown for form rate limit
  const startFormCountdown = (endTime: number) => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    
    const updateTimer = () => {
      const now = Date.now();
      const remaining = endTime - now;
      
      if (remaining <= 0) {
        // Rate limit expired
        clearInterval(countdownTimerRef.current!);
        setFormRateLimited(false);
        setFormTimeRemaining("");
        localStorage.removeItem("signupFormRateLimit");
      } else {
        setFormTimeRemaining(formatTimeRemaining(remaining));
      }
    };
    
    // Initial update
    updateTimer();
    
    // Update every second
    countdownTimerRef.current = setInterval(updateTimer, 1000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateStep = async (currentStep: number) => {
    // Don't allow validation if rate limited
    if (formRateLimited) {
      setAlertMessage(`Please wait ${formTimeRemaining} before continuing. Too many failed attempts.`);
      setAlertOpen(true);
      return false;
    }
    
    const newErrors: Record<string, string> = {};
    
    if (currentStep === 1) {
      // Validate username
      if (!formData.username.trim()) {
        newErrors.username = "Username is required";
      } else {
        try {
          const response = await fetch("/api/signup/check-username", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: formData.username })
          });
          const data = await response.json();
          
          if (response.status === 429) {
            // Handle rate limit response
            const seconds = data.seconds_remaining || 60;
            const now = Date.now();
            const end = now + seconds * 1000;
            
            // Store rate limit
            setFormRateLimited(true);
            setFormRateLimitEnd(end);
            startFormCountdown(end);
            localStorage.setItem("signupFormRateLimit", JSON.stringify({ end }));
            
            // Show rate limit message
            setAlertMessage(data.message || `Too many failed attempts. Please wait ${formatTimeRemaining(seconds * 1000)} before continuing.`);
            setAlertOpen(true);
            return false;
          }
          
          if (!data.valid) {
            newErrors.username = data.message;
          }
        } catch (error) {
          console.error("Error validating username:", error);
          newErrors.username = "Failed to validate username";
        }
      }
      
      // Validate email
      if (!formData.email.trim()) {
        newErrors.email = "Email is required";
      } else {
        try {
          const response = await fetch("/api/signup/check-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: formData.email })
          });
          const data = await response.json();
          
          if (response.status === 429) {
            // Handle rate limit response
            const seconds = data.seconds_remaining || 60;
            const now = Date.now();
            const end = now + seconds * 1000;
            
            // Store rate limit
            setFormRateLimited(true);
            setFormRateLimitEnd(end);
            startFormCountdown(end);
            localStorage.setItem("signupFormRateLimit", JSON.stringify({ end }));
            
            // Show rate limit message
            setAlertMessage(data.message || `Too many failed attempts. Please wait ${formatTimeRemaining(seconds * 1000)} before continuing.`);
            setAlertOpen(true);
            return false;
          }
          
          if (!data.valid) {
            newErrors.email = data.message;
          }
        } catch (error) {
          console.error("Error validating email:", error);
          newErrors.email = "Failed to validate email";
        }
      }
      
      // Validate date of birth
      if (!formData.dob) {
        newErrors.dob = "Date of birth is required";
      } else {
        try {
          const response = await fetch("/api/signup/check-dob", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dob: formData.dob })
          });
          const data = await response.json();
          
          if (response.status === 429) {
            // Handle rate limit response
            const seconds = data.seconds_remaining || 60;
            const now = Date.now();
            const end = now + seconds * 1000;
            
            // Store rate limit
            setFormRateLimited(true);
            setFormRateLimitEnd(end);
            startFormCountdown(end);
            localStorage.setItem("signupFormRateLimit", JSON.stringify({ end }));
            
            // Show rate limit message
            setAlertMessage(data.message || `Too many failed attempts. Please wait ${formatTimeRemaining(seconds * 1000)} before continuing.`);
            setAlertOpen(true);
            return false;
          }
          
          if (!data.valid) {
            newErrors.dob = data.message;
          }
        } catch (error) {
          console.error("Error validating date of birth:", error);
          newErrors.dob = "Failed to validate date of birth";
        }
      }
    } else if (currentStep === 2) {
      // Validate secret word - updated requirements
      if (!formData.secretWord.trim()) {
        newErrors.secretWord = "Secret word is required";
      } else if (formData.secretWord.length < 6) {
        newErrors.secretWord = "Secret word must be at least 6 characters";
      } else if (formData.secretWord.length > 12) {
        newErrors.secretWord = "Secret word cannot exceed 12 characters";
      } else if (!/^[a-zA-Z]+$/.test(formData.secretWord)) {
        newErrors.secretWord = "Secret word can only contain letters (no numbers, spaces, or special characters)";
      }
      
      // Validate password - updated requirements
      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters (16+ recommended for better security)";
      } else {
        const hasUppercase = /[A-Z]/.test(formData.password);
        const hasLowercase = /[a-z]/.test(formData.password);
        const hasDigit = /[0-9]/.test(formData.password);
        const hasSpecial = /[!@#$%^&*()_\-+=<>?/\[\]{}]/.test(formData.password);

        const missing = [];
        if (!hasUppercase) missing.push("uppercase letter");
        if (!hasLowercase) missing.push("lowercase letter");
        if (!hasDigit) missing.push("number");
        if (!hasSpecial) missing.push("special character");

        if (missing.length > 0) {
          newErrors.password = `Password must include at least one ${missing.join(", one ")}`;
        }
      }
      
      // Validate password confirmation
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    } else if (currentStep === 3) {
      // Validate OTP
      if (!formData.otp.trim()) {
        newErrors.otp = "Verification code is required";
      } else if (!/^\d{6}$/.test(formData.otp)) {
        newErrors.otp = "Verification code must be 6 digits";
      }
    }
    
    setErrors(newErrors);
    
    // If there are multiple errors, increment form abuse counter in localStorage
    if (Object.keys(newErrors).length > 1) {
      const storedFormLimit = localStorage.getItem("signupFormRateLimit");
      let errorCount = 1;
      
      if (storedFormLimit) {
        try {
          const { errorCount: count = 0 } = JSON.parse(storedFormLimit);
          errorCount = count + 1;
        } catch (e) {
          errorCount = 1;
        }
      }
      
      // Store updated error count
      localStorage.setItem("signupFormRateLimit", JSON.stringify({ 
        errorCount,
        end: formRateLimitEnd || 0
      }));
      
      // Rate limiting tiers for client-side tracking:
      // 5 errors: warn
      // 10+ errors: suggest to be more careful
      if (errorCount >= 10) {
        setAlertMessage("You're making too many errors. Please be more careful with your entries to avoid being temporarily restricted from the form.");
        setAlertOpen(true);
      } else if (errorCount >= 5) {
        setAlertMessage("Several errors detected. Please double-check your information before continuing.");
        setAlertOpen(true);
      }
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const sendOTP = async () => {
    // Check if rate limited
    if (otpRateLimited) {
      setAlertMessage(`Please wait ${otpTimeRemaining} before requesting another code. You can only send a verification code once every 5 minutes.`);
      setAlertOpen(true);
      return;
    }
    
    setSendingOtp(true);
    try {
      const response = await fetch("/api/signup/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setOtpSent(true);
      } else if (response.status === 429) {
        // Handle rate limit error
        setOtpRateLimited(true);
        const seconds = data.seconds_remaining || 300; // Default to 5 minutes
        const now = Date.now();
        const end = now + seconds * 1000;
        
        // Store in state
        setOtpRateLimitEnd(end);
        startOtpCountdown(end);
        
        // Store in localStorage for persistence
        localStorage.setItem("otpSendRateLimit", JSON.stringify({
          end: end
        }));
        
        setAlertMessage(data.message || `Rate limit exceeded. Please wait ${formatTimeRemaining(seconds * 1000)} before trying again.`);
        setAlertOpen(true);
      } else {
        setAlertMessage(data.message || "Failed to send verification code. Please try again.");
        setAlertOpen(true);
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      setAlertMessage("An unexpected error occurred. Please try again.");
      setAlertOpen(true);
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOTP = async () => {
    // Check if rate limited
    if (verifyRateLimited) {
      setErrors({ ...errors, otp: `Too many incorrect attempts. Please try again in ${verifyTimeRemaining}.` });
      return false;
    }
    
    if (!formData.otp.trim()) {
      setErrors({ ...errors, otp: "Verification code is required" });
      return false;
    }
    
    try {
      const response = await fetch("/api/signup/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          otp: formData.otp
        })
      });
      
      const data = await response.json();
      
      if (data.valid) {
        // Reset attempts on success
        setVerifyAttemptsRemaining(4);
        localStorage.removeItem("otpVerifyRateLimit");
        return true;
      } else if (response.status === 429) {
        // Handle rate limit error
        setVerifyRateLimited(true);
        const seconds = data.seconds_remaining || 900; // Default to 15 minutes
        const now = Date.now();
        const end = now + seconds * 1000;
        
        // Store in state
        setVerifyRateLimitEnd(end);
        startVerifyCountdown(end);
        
        // Store in localStorage
        localStorage.setItem("otpVerifyRateLimit", JSON.stringify({
          end: end,
          attempts: 0
        }));
        
        // Update the error message to mention the 4 attempts limit
        const attemptsMessage = data.attempts_remaining > 0 ? 
          `${data.attempts_remaining} attempts remaining before 15-minute lockout.` : 
          "No attempts remaining. You'll be locked out for 15 minutes on the next failed attempt.";
        
        setErrors({ ...errors, otp: data.message || `Too many incorrect attempts. Please try again in ${formatTimeRemaining(seconds * 1000)}.` + ` ${attemptsMessage}` });
        return false;
      } else {
        // Handle incorrect attempt but not rate limited
        if (data.attempts_remaining !== undefined) {
          setVerifyAttemptsRemaining(data.attempts_remaining);
          
          // Store in localStorage
          localStorage.setItem("otpVerifyRateLimit", JSON.stringify({
            end: 0,
            attempts: data.attempts_remaining
          }));
        }
        
        // Update the error message to mention the 4 attempts limit
        const attemptsMessage = data.attempts_remaining > 0 ? 
          `${data.attempts_remaining} attempts remaining before 15-minute lockout.` : 
          "No attempts remaining. You'll be locked out for 15 minutes on the next failed attempt.";
        
        setErrors({ ...errors, otp: (data.message || "Invalid verification code") + ` ${attemptsMessage}` });
        return false;
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      setErrors({ ...errors, otp: "Failed to verify code. Please try again." });
      return false;
    }
  };

  const checkExistingWallet = async () => {
    try {
      const response = await fetch("/api/signup/check-existing-wallet");
      const data = await response.json();
      
      if (response.ok && data.has_wallet) {
        setAlertMessage(data.message || "You already have a Cryptonel wallet. Redirecting to dashboard...");
        setAlertOpen(true);
        
        // Redirect after a short delay to ensure message is seen
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error checking wallet existence:", error);
      return false;
    }
  };

  const nextStep = async () => {
    // Check if user already has a wallet
    const hasWallet = await checkExistingWallet();
    if (hasWallet) return;
    
    const isValid = await validateStep(step);
    if (!isValid) return;
    
    if (step === 2) {
      // When moving from step 2 to step 3, send OTP
      await sendOTP();
    }
    
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if rate limited
    if (formRateLimited) {
      setAlertMessage(`Form temporarily restricted. Please wait ${formTimeRemaining} before trying again.`);
      setAlertOpen(true);
      return;
    }
    
    // Check if user already has a wallet
    const hasWallet = await checkExistingWallet();
    if (hasWallet) return;
    
    // Check if OTP is verified
    const otpVerified = await verifyOTP();
    if (!otpVerified) return;
    
    setLoading(true);
    
    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.status === 429) {
        // Handle rate limit response
        const seconds = data.seconds_remaining || 60;
        const now = Date.now();
        const end = now + seconds * 1000;
        
        // Store rate limit
        setFormRateLimited(true);
        setFormRateLimitEnd(end);
        startFormCountdown(end);
        localStorage.setItem("signupFormRateLimit", JSON.stringify({ end }));
        
        // Show rate limit message
        setAlertMessage(data.message || `Too many failed attempts. Please wait ${formatTimeRemaining(seconds * 1000)} before continuing.`);
        setAlertOpen(true);
        return;
      }
      
      if (response.ok) {
        // Save tokens if provided
        if (data.tokens?.access_token) {
          localStorage.setItem("access_token", data.tokens.access_token);
        }
        
        // Redirect to dashboard
        navigate("/dashboard");
      } else {
        // Handle validation errors
        if (data.validation_errors) {
          setErrors(data.validation_errors);
          
          // Count this as a form error for local rate limiting
          const storedFormLimit = localStorage.getItem("signupFormRateLimit");
          let errorCount = 1;
          
          if (storedFormLimit) {
            try {
              const { errorCount: count = 0 } = JSON.parse(storedFormLimit);
              errorCount = count + 1;
            } catch (e) {
              errorCount = 1;
            }
          }
          
          // Store updated error count
          localStorage.setItem("signupFormRateLimit", JSON.stringify({ 
            errorCount,
            end: formRateLimitEnd || 0
          }));
          
        } else {
          setAlertMessage(data.message || "Registration failed. Please try again.");
          setAlertOpen(true);
        }
      }
    } catch (error) {
      console.error("Error during registration:", error);
      setAlertMessage("An unexpected error occurred. Please try again.");
      setAlertOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Animation variants
  const fadeVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              opacity: particle.opacity,
              boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            }}
          />
        ))}
      </div>

      <div 
        ref={containerRef}
        className="w-full md:max-w-5xl bg-gradient-to-br from-[#0a0c11]/95 via-[#050c17]/95 to-[#0a0c11]/95 md:rounded-2xl md:shadow-2xl overflow-hidden flex flex-col md:flex-row border border-[#D4D5F4]/10"
        style={{
          '--mouse-x': '50%',
          '--mouse-y': '50%',
        } as React.CSSProperties}
      >
        {/* Left sidebar */}
        <div className="w-full md:w-[280px] p-6 md:p-8 border-b md:border-b-0 md:border-r border-[#2A2A2A]">
          <h1 className="text-2xl font-bold text-white mb-6">Wallet Registration</h1>

          {/* Progress bar */}
          <div className="w-full bg-[#1E1E1E] h-2 rounded-full mb-6 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <div className="space-y-6">
            {[
              { step: 1, title: "Personal Info", icon: User },
              { step: 2, title: "Security", icon: Lock },
              { step: 3, title: "Verification", icon: KeyRound }
            ].map((item) => (
              <div
                key={item.step}
                className={`flex items-center gap-4 transition-all duration-300 ${
                  step === item.step ? "text-white" : "text-gray-500"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    step === item.step
                      ? "bg-purple-600 text-white"
                      : step > item.step
                      ? "bg-green-500 text-white"
                      : "bg-[#1E1E1E] text-gray-400"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className={`font-medium ${step === item.step ? "text-white" : "text-gray-400"}`}>
                    {item.title}
                  </p>
                  <div className="text-xs text-gray-500">
                    {step > item.step
                      ? "Completed"
                      : step === item.step
                      ? "In progress"
                      : "Pending"}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-8 hidden md:block">
            <div className="text-gray-500 text-sm">
              <p>Need help?</p>
              <p className="text-purple-500 cursor-pointer hover:underline">Contact support</p>
            </div>
          </div>
        </div>

        {/* Right content */}
        <div className="w-full md:flex-1 p-6 md:p-8 flex flex-col">
          {/* Rate limit warning banner */}
          {formRateLimited && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/20 border border-red-500/40 rounded-lg p-4 mb-6 text-white flex items-start"
            >
              <AlertCircle className="w-5 h-5 mr-3 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium">Form Temporarily Restricted</h3>
                <p className="text-sm text-gray-300 mt-1">
                  Too many failed attempts detected. Please wait {formTimeRemaining} before trying again.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  This is to prevent spam and abuse of our registration system.
                </p>
              </div>
            </motion.div>
          )}
          
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
            <div className="flex-1">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="step1" variants={fadeVariants} initial="hidden" animate="visible" exit="exit">
                    <h2 className="text-2xl font-bold text-white mb-8">Personal Information</h2>

                    <div className="space-y-6">
                      <Input
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        placeholder="Username"
                        icon={User}
                        error={errors.username}
                        required
                      />
                      <div className="text-xs text-[#D4D5F4]/70 pl-6">
                        <p>• 3-12 characters long</p>
                        <p>• Must start with a letter</p>
                        <p>• Only letters and numbers</p>
                        <p>• Examples: John123, User5, GameMaster</p>
                      </div>

                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Email Address"
                        icon={Mail}
                        error={errors.email}
                        required
                      />
                      <div className="text-xs text-[#D4D5F4]/70 pl-6">
                        <p>• Gmail, Outlook, or Hotmail addresses only</p>
                        <p>• No special characters allowed in email username</p>
                        <p>• Examples: johnsmith@gmail.com, user123@outlook.com</p>
                      </div>

                      <Input
                        id="dob"
                        name="dob"
                        type="date"
                        value={formData.dob}
                        onChange={handleInputChange}
                        placeholder="Date of Birth"
                        icon={Calendar}
                        error={errors.dob}
                        required
                      />
                      <div className="text-xs text-[#D4D5F4]/70 pl-6">
                        <p>• You must be at least 18 years old</p>
                        <p>• Date format: YYYY-MM-DD</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="step2" variants={fadeVariants} initial="hidden" animate="visible" exit="exit">
                    <h2 className="text-2xl font-bold text-white mb-8">Security Settings</h2>

                    <div className="space-y-6">
                      <Input
                        id="secretWord"
                        name="secretWord"
                        type="password"
                        value={formData.secretWord}
                        onChange={handleInputChange}
                        placeholder="Secret Word"
                        icon={Shield}
                        error={errors.secretWord}
                        required
                      />
                      <div className="text-xs text-[#D4D5F4]/70 pl-6">
                        <p>• 6-12 letters only (no numbers or special characters)</p>
                        <p>• No spaces allowed</p>
                        <p>• Examples: Secret, Password, WalletKey</p>
                      </div>

                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Password"
                        icon={Lock}
                        error={errors.password}
                        required
                      />
                      {formData.password && <PasswordStrengthMeter password={formData.password} />}
                      <div className="text-xs text-[#D4D5F4]/70 pl-6 mt-2">
                        <p>• Minimum 8 characters (16+ recommended)</p>
                        <p>• Must include: uppercase letters, lowercase letters,</p>
                        <p>  numbers, and special characters (!@#$%^&*)</p>
                        <p>• Example: StrongP@ss123</p>
                      </div>

                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Confirm Password"
                        icon={Lock}
                        error={errors.confirmPassword}
                        required
                      />
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="step3" variants={fadeVariants} initial="hidden" animate="visible" exit="exit">
                    <h2 className="text-2xl font-bold text-white mb-8">Email Verification</h2>

                    <div className="space-y-6">
                      <div className="bg-[#1E1E1E]/50 p-6 rounded-lg">
                        <p className="text-white mb-4">
                          We've sent a verification code to: <span className="text-purple-400 font-semibold">{formData.email}</span>
                        </p>
                        <p className="text-gray-400 text-sm">
                          Please check your inbox (and spam folder) for the verification code and enter it below.
                        </p>
                        <p className="text-gray-400 text-xs mt-2">
                          Note: You can only request a new code once every 5 minutes.
                        </p>
                      </div>

                      <Input
                        id="otp"
                        name="otp"
                        type="text"
                        value={formData.otp}
                        onChange={handleInputChange}
                        placeholder="Verification Code"
                        icon={KeyRound}
                        error={errors.otp}
                        required
                        disabled={verifyRateLimited}
                      />
                      <div className="text-xs text-[#D4D5F4]/70 pl-6">
                        <p>• Enter the 6-digit code sent to your email</p>
                        <p>• Code expires after 5 minutes</p>
                        <p>• You have 4 attempts to enter the correct code</p>
                        <p>• After 4 failed attempts, you'll be locked out for 15 minutes</p>
                        {verifyAttemptsRemaining < 4 && !verifyRateLimited && (
                          <p className="text-yellow-500 mt-1">• You have {verifyAttemptsRemaining} attempts remaining</p>
                        )}
                        {verifyRateLimited && (
                          <p className="text-red-500 mt-1">• Too many failed attempts. Try again in {verifyTimeRemaining}</p>
                        )}
                      </div>

                      {verifyRateLimited ? (
                        <div className="flex items-center gap-2 text-red-500 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>Please wait {verifyTimeRemaining} before trying again</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={sendOTP}
                          disabled={sendingOtp || otpRateLimited}
                          className={`bg-transparent border border-purple-500 text-purple-400 hover:bg-purple-500/10 py-2 px-4 rounded-lg text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
                            (sendingOtp || otpRateLimited) ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          {sendingOtp ? (
                            <>
                              <div className="animate-spin h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                              <span>Sending...</span>
                            </>
                          ) : otpRateLimited ? (
                            <>Wait {otpTimeRemaining}</>
                          ) : otpSent ? (
                            "Resend Code"
                          ) : (
                            "Send Code"
                          )}
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Button container at bottom */}
            <div className="mt-10 flex flex-col sm:flex-row justify-center sm:justify-between gap-4 pt-4 border-t border-[#2A2A2A]">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={loading}
                  className="bg-transparent border border-[#2A2A2A] text-white hover:bg-[#2A2A2A] flex items-center justify-center gap-2 h-14 px-8 text-lg rounded-xl w-full sm:w-auto transition-all duration-300"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>
              ) : (
                <div className="hidden sm:block"></div>
              )}

              <button
                type={step === 3 ? "submit" : "button"}
                onClick={step < 3 ? nextStep : undefined}
                disabled={loading || formRateLimited}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white flex items-center justify-center gap-3 h-16 px-10 text-xl font-medium rounded-xl w-full sm:w-auto transition-all duration-300 shadow-lg hover:shadow-purple-900/30 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Processing...</span>
                  </div>
                ) : formRateLimited ? (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>Temporarily Restricted</span>
                  </>
                ) : step < 3 ? (
                  <>
                    Continue
                    <ArrowRight className="w-6 h-6" />
                  </>
                ) : (
                  "Complete Registration"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Alert Modal */}
      {alertOpen && (
        <AlertModal
          isOpen={alertOpen}
          message={alertMessage}
          onClose={() => setAlertOpen(false)}
        />
      )}
    </div>
  );
};

export default SignUp;