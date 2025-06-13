import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Star, Award, MessageCircle, Calendar, Zap } from "lucide-react";
import { motion } from "framer-motion";

interface RatingEntry {
  rater_id: string;
  rater_username: string;
  stars: number;
  comment?: string | null;
  timestamp?: string;
}

interface RatingsData {
  total_ratings: number;
  average_rating: number;
  ratings: RatingEntry[];
}

interface UserData {
  username: string;
  user_id: string;
  avatar?: string;
  premium?: boolean;
  vip?: boolean;
  verified?: boolean;
  account_type?: string;
  bio?: string;
}

interface RaterInfo {
  [key: string]: {
    avatar?: string;
  };
}

const getDiscordAvatar = (userId: string, avatarId?: string) => {
  if (!userId || !avatarId) {
    console.log(`Missing avatar data: userId=${userId}, avatarId=${avatarId}`);
    return "https://cdn.discordapp.com/embed/avatars/0.png";
  }
  
  // Check if avatar is animated (starts with a_)
  const extension = avatarId.startsWith("a_") ? "gif" : "png";
  const avatarUrl = `https://cdn.discordapp.com/avatars/${userId}/${avatarId}.${extension}`;
  
  console.log(`Generated Discord avatar URL: ${avatarUrl} (userId=${userId}, avatarId=${avatarId})`);
  return avatarUrl;
};

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6 }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const PublicProfile: React.FC = () => {
  const { username = "" } = useParams<{ username: string }>();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [ratingsData, setRatingsData] = useState<RatingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [raterInfo, setRaterInfo] = useState<RaterInfo>({});
  const [activeTab, setActiveTab] = useState<"ratings" | "stats">("ratings");

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log(`Fetching profile for username: ${username}`);
        const response = await fetch(`/api/public-profile/${username}`);
        if (!response.ok) {
          throw new Error("User not found");
        }
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || "Unknown error");
        }
        
        console.log("User data received:", data.user);
        console.log(`Debug - User avatar data: ID=${data.user.user_id}, avatar=${data.user.avatar}`);
        setUserData(data.user);
        setRatingsData(data.ratings);

        // Fetch avatars
        const fetchAvatars = async () => {
          try {
            // Always fetch the profile owner's avatar
            if (data.user && data.user.user_id) {
              let userIds = [data.user.user_id];
              
              // Add rater IDs if there are ratings
              if (data.ratings && data.ratings.ratings && data.ratings.ratings.length > 0) {
                const raterIds = data.ratings.ratings.map((r: RatingEntry) => r.rater_id);
                userIds = [...new Set([...userIds, ...raterIds])]; // Deduplicate IDs
              }
              
              console.log("Fetching avatars for IDs:", userIds);
              
              const response = await fetch(`/api/discord-users?ids=${userIds.join(',')}`);
              if (response.ok) {
                const avatarData = await response.json();
                console.log("Users avatar data received:", avatarData);
                
                if (avatarData.success && avatarData.users) {
                  // Process avatar data
                  const avatarMap: RaterInfo = {};
                  avatarData.users.forEach((user: any) => {
                    avatarMap[user.user_id] = {
                      avatar: user.avatar
                    };
                  });
                  
                  // Update rater info
                  setRaterInfo(avatarMap);
                  
                  // Update profile owner avatar if available
                  if (avatarMap[data.user.user_id]) {
                    setUserData(prevData => {
                      if (prevData) {
                        return {
                          ...prevData,
                          avatar: avatarMap[data.user.user_id].avatar || prevData.avatar
                        };
                      }
                      return prevData;
                    });
                  }
                }
              }
            }
          } catch (err) {
            console.error("Failed to fetch avatars", err);
          }
        };
        
        // Execute the avatar fetching
        fetchAvatars();
      } catch (err: any) {
        console.error("Error loading profile:", err);
        setError(err.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [username]);

  const renderStars = (count: number, size = 18) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={`transition-all duration-300 ${
              star <= count ? "text-yellow-400 fill-current" : "text-gray-600"
            }`}
            fill={star <= count ? "currentColor" : "none"}
          />
        ))}
      </div>
    );
  };

  // Calculate rating distribution
  const calculateDistribution = () => {
    if (!ratingsData || !ratingsData.ratings || ratingsData.ratings.length === 0) {
      return [];
    }
    
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingsData.ratings.forEach(rating => {
      if (rating.stars >= 1 && rating.stars <= 5) {
        counts[rating.stars as keyof typeof counts]++;
      }
    });
    
    const total = ratingsData.ratings.length;
    return Object.entries(counts).map(([stars, count]) => ({
      stars: Number(stars),
      count,
      percentage: Math.round((count / total) * 100)
    })).sort((a, b) => b.stars - a.stars); // Sort 5 to 1
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#000000]">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 w-16 h-16 rounded-full border-4 border-[#b9a64b] border-t-transparent animate-spin"></div>
          <div className="absolute top-2 left-2 w-12 h-12 rounded-full border-4 border-[#8c8c6a] border-t-transparent animate-spin-slow"></div>
        </div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#000000] text-[#FFFFFF] p-6">
        <div className="p-8 rounded-2xl bg-[#1a1a1a]/80 backdrop-blur-md border border-[#8c8c6a] shadow-xl">
          <h2 className="text-2xl font-bold mb-4 text-[#ff5a5a]">Profile Not Found</h2>
          <p className="text-gray-300">{error || "User not found"}</p>
        </div>
      </div>
    );
  }

  const distribution = calculateDistribution();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#000000] to-[#1a1a1a] text-white">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-[#b9a64b]/10 blur-3xl"></div>
        <div className="absolute top-1/3 -right-20 w-80 h-80 rounded-full bg-[#8c8c6a]/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-1/3 w-96 h-96 rounded-full bg-[#b9a64b]/10 blur-3xl"></div>
      </div>

      {/* Banner Section with Glassmorphism */}
      <div className="relative h-60 sm:h-72 md:h-80 w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#000000]/80 via-[#b9a64b]/20 to-[#000000]/80 backdrop-blur-sm"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB4PSIwIiB5PSIwIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHBhdHRlcm5UcmFuc2Zvcm09InJvdGF0ZSgzMCkiPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSI+PC9yZWN0PjwvcGF0dGVybj48L2RlZnM+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNwYXR0ZXJuKSI+PC9yZWN0Pjwvc3ZnPg==')]"></div>
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#000000] to-transparent"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-28 relative z-10">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="w-full"
        >
          {/* Header Section with Avatar */}
          <motion.div 
            variants={fadeIn}
            className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-12"
          >
            <div className="relative">
              <div className="rounded-full p-1.5 bg-gradient-to-br from-[#b9a64b] to-[#8c8c6a]">
                <div className="rounded-full p-0.5 bg-[#000000]">
                  <img
                    src={raterInfo[userData.user_id]?.avatar 
                      ? getDiscordAvatar(userData.user_id, raterInfo[userData.user_id].avatar)
                      : getDiscordAvatar(userData.user_id, userData.avatar)}
                    alt="Avatar"
                    className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-[#000000]"
                    onLoad={() => console.log("Avatar loaded successfully")}
                    onError={(e) => {
                      console.error("Avatar loading error, using fallback");
                      console.error(`Failed avatar URL for user ID: ${userData.user_id}`);
                      const target = e.target as HTMLImageElement;
                      target.src = "https://cdn.discordapp.com/embed/avatars/0.png";
                    }}
                  />
                </div>
              </div>
              
              {/* Status indicator */}
              <span className="absolute bottom-3 right-3 w-5 h-5 bg-green-500 rounded-full border-4 border-[#000000]"></span>
              
              {/* Badges */}
              <div className="absolute -bottom-2 -left-2 flex gap-1">
                {userData.premium && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#b9a64b] to-[#8c8c6a] flex items-center justify-center">
                    <Zap size={16} className="text-white" />
                  </div>
                )}
                {userData.vip && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#b9a64b] to-[#8c8c6a] flex items-center justify-center">
                    <Award size={16} className="text-white" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-2 justify-center md:justify-start flex-wrap">
                  {userData.username}
                  {userData.verified && (
                    <svg
                      className="h-6 w-6 text-[#b9a64b]"
                      viewBox="0 0 22 22"
                      fill="currentColor"
                    >
                      <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
                    </svg>
                  )}
                </h1>
              </div>
              
              {userData.account_type && (
                <p className="text-gray-400 text-sm md:text-base mb-3">{userData.account_type}</p>
              )}
              
              {/* Bio section */}
              <p className="text-gray-300 text-sm md:text-base max-w-lg mx-auto md:mx-0">
                {userData.bio || `Welcome to ${userData.username}'s profile! Check out their ratings and reviews below.`}
              </p>
            </div>
            
            {/* Rating summary for desktop */}
            {ratingsData && (
              <div className="hidden md:block">
                <div className="bg-[#000000]/60 backdrop-blur-md rounded-2xl p-4 border border-[#8c8c6a] shadow-lg">
                  <div className="text-3xl font-bold text-center text-[#b9a64b]">
                    {ratingsData.average_rating.toFixed(1)}
                  </div>
                  <div className="flex items-center justify-center mt-1">
                    {renderStars(Math.round(ratingsData.average_rating), 16)}
                  </div>
                  <div className="text-xs text-center text-gray-400 mt-1">
                    {ratingsData.total_ratings} {ratingsData.total_ratings === 1 ? 'review' : 'reviews'}
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Rating summary for mobile */}
          {ratingsData && (
            <motion.div 
              variants={fadeIn}
              className="md:hidden mb-8"
            >
              <div className="bg-[#000000]/60 backdrop-blur-md rounded-2xl p-4 border border-[#8c8c6a] shadow-lg flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#b9a64b]">
                    {ratingsData.average_rating.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-400">out of 5</div>
                </div>
                
                <div className="flex flex-col">
                  <div className="flex items-center">
                    {renderStars(Math.round(ratingsData.average_rating), 16)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {ratingsData.total_ratings} {ratingsData.total_ratings === 1 ? 'review' : 'reviews'}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tabs */}
          <motion.div 
            variants={fadeIn}
            className="flex border-b border-[#8c8c6a] mb-6"
          >
            <button 
              className={`px-4 py-3 font-medium text-sm flex items-center gap-2 transition-all ${
                activeTab === "ratings" 
                  ? "text-[#b9a64b] border-b-2 border-[#b9a64b]" 
                  : "text-gray-400 hover:text-gray-200"
              }`}
              onClick={() => setActiveTab("ratings")}
            >
              <MessageCircle size={18} />
              Reviews
            </button>
            <button 
              className={`px-4 py-3 font-medium text-sm flex items-center gap-2 transition-all ${
                activeTab === "stats" 
                  ? "text-[#b9a64b] border-b-2 border-[#b9a64b]" 
                  : "text-gray-400 hover:text-gray-200"
              }`}
              onClick={() => setActiveTab("stats")}
            >
              <Star size={18} />
              Statistics
            </button>
          </motion.div>

          {/* Content based on active tab */}
          {activeTab === "stats" && (
            <motion.div 
              variants={fadeIn}
              className="mb-10"
            >
              {distribution.length > 0 ? (
                <div className="bg-[#000000]/60 backdrop-blur-md rounded-2xl p-6 border border-[#8c8c6a] shadow-lg">
                  <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <Award className="text-[#b9a64b]" size={20} />
                    Rating Distribution
                  </h2>
                  <div className="space-y-4">
                    {distribution.map(item => (
                      <div key={item.stars} className="flex items-center gap-3">
                        <div className="flex items-center w-16 text-sm">
                          {item.stars} <Star size={14} className="ml-1 text-yellow-400 fill-current" fill="currentColor" />
                        </div>
                        <div className="flex-1 h-3 bg-[#2a2a30] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#b9a64b] to-[#8c8c6a] rounded-full"
                            style={{ 
                              width: `${item.percentage}%`,
                              transition: "width 1s ease-out" 
                            }}
                          ></div>
                        </div>
                        <div className="w-12 text-right text-sm text-gray-400">{item.percentage}%</div>
                      </div>
                    ))}
                  </div>

                  {/* Additional stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-[#8c8c6a]">
                    <div className="text-center p-3 rounded-xl bg-[#2a2a30]/50">
                      <div className="text-2xl font-bold text-[#b9a64b]">{ratingsData?.total_ratings || 0}</div>
                      <div className="text-xs text-gray-400 mt-1">Total Reviews</div>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-[#2a2a30]/50">
                      <div className="text-2xl font-bold text-[#b9a64b]">
                        {ratingsData?.average_rating.toFixed(1) || "0.0"}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">Average Rating</div>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-[#2a2a30]/50">
                      <div className="text-2xl font-bold text-[#b9a64b]">
                        {distribution.length > 0 ? `${Math.max(...distribution.map(d => d.percentage))}%` : "0%"}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">Most Common</div>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-[#2a2a30]/50">
                      <div className="text-2xl font-bold text-[#b9a64b]">
                        {distribution.find(d => d.stars === 5)?.count || 0}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">5-Star Reviews</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-[#000000]/60 backdrop-blur-md rounded-2xl p-6 border border-[#8c8c6a] shadow-lg text-center">
                  <p className="text-gray-400">No ratings data available yet.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "ratings" && (
            <motion.div 
              variants={fadeIn}
              className="mb-10"
            >
              {/* Ratings List */}
              <div className="bg-[#000000]/60 backdrop-blur-md rounded-2xl p-6 border border-[#8c8c6a] shadow-lg">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <MessageCircle className="text-[#b9a64b]" size={20} />
                  Reviews
                </h2>
                
                {ratingsData && ratingsData.ratings.length === 0 && (
                  <div className="text-center py-10">
                    <div className="mb-4 inline-flex p-4 rounded-full bg-[#2a2a30]/50">
                      <MessageCircle size={32} className="text-gray-500" />
                    </div>
                    <p className="text-gray-400">No reviews yet.</p>
                    <p className="text-gray-500 text-sm mt-2">Be the first to leave a review!</p>
                  </div>
                )}
                
                <motion.div 
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="space-y-6"
                >
                  {ratingsData?.ratings.map((rating, idx) => (
                    <motion.div
                      variants={fadeIn}
                      key={idx}
                      className="border-b border-[#8c8c6a] pb-6 last:border-b-0 last:pb-0"
                    >
                      <div className="flex items-start gap-3">
                        {/* Rater avatar */}
                        <div className="rounded-full p-0.5 bg-gradient-to-br from-[#b9a64b]/50 to-[#8c8c6a]/50">
                          <img 
                            src={getDiscordAvatar(rating.rater_id, raterInfo[rating.rater_id]?.avatar)} 
                            alt={rating.rater_username}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              console.error(`Rater avatar error for ${rating.rater_username}`);
                              const target = e.target as HTMLImageElement;
                              target.src = "https://cdn.discordapp.com/embed/avatars/0.png";
                            }}
                          />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
                            <div>
                              <span className="font-medium text-[#FFFFFF] block sm:inline">
                                {rating.rater_username || "Anonymous"}
                              </span>
                              {rating.timestamp && (
                                <span className="text-gray-500 text-xs flex items-center gap-1 mt-1 sm:mt-0 sm:ml-2">
                                  <Calendar size={12} />
                                  {new Date(rating.timestamp).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                              )}
                            </div>
                            {renderStars(rating.stars)}
                          </div>
                          
                          {rating.comment ? (
                            <div className="bg-[#1a1a1a]/30 rounded-xl p-4 mt-2">
                              <p className="text-gray-300 whitespace-pre-line">
                                {rating.comment}
                              </p>
                            </div>
                          ) : (
                            <p className="text-gray-500 italic text-sm">No comment provided</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
      
      {/* Footer - removing copyright */}
      <div className="py-6 text-center text-gray-500 text-sm">
        <p></p>
      </div>
    </div>
  );
};

export default PublicProfile; 