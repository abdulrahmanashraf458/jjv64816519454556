import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Share2,
  Settings,
  Copy,
  CheckCircle2,
  // Eye,
  // EyeOff,
  // Lock,
  // Unlock,
  // Users,
  // UserPlus,
  // MessageSquare,
  // Shield,
} from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface Rating {
  rater_id: string;
  rater_username: string;
  stars: number;
  comment: string;
  timestamp: string;
}

interface MyRating {
  user_id: string;
  username: string;
  stars: number;
  comment: string;
  timestamp: string;
  transaction_id: string;
  amount: number;
}

interface RatingStats {
  average_rating: number;
  total_ratings: number;
  distribution: Array<{
    stars: number;
    percentage: number;
  }>;
  featured_quote: {
    text: string;
    author: string;
    stars: number;
  };
}

interface RatingSettings {
  enabled: boolean;
  showComments: boolean;
  onlyPositive: boolean;
  whoCanRate: "all" | "recipients" | "verified";
  showRaterIdentity: boolean;
  customLink: string;
  thankYouMessage: string;
  emailNotifications: boolean;
  allowMultipleRatings: boolean;
  requireAccount: boolean;
  allowReply: boolean;
  requireApproval: boolean;
}

const defaultRatingStats: RatingStats = {
  average_rating: 0,
  total_ratings: 0,
  distribution: [
    { stars: 5, percentage: 0 },
    { stars: 4, percentage: 0 },
    { stars: 3, percentage: 0 },
    { stars: 2, percentage: 0 },
    { stars: 1, percentage: 0 },
  ],
  featured_quote: {
    text: "No ratings yet",
    author: "",
    stars: 0,
  },
};

const defaultSettings: RatingSettings = {
  enabled: true,
  showComments: true,
  onlyPositive: false,
  whoCanRate: "all",
  showRaterIdentity: true,
  customLink: "",
  thankYouMessage: "Thank you for your rating!",
  emailNotifications: false,
  allowMultipleRatings: false,
  requireAccount: false,
  allowReply: false,
  requireApproval: false,
};

interface RatingsProps {
  setHideLayout?: (hide: boolean) => void;
}

const Ratings: React.FC<RatingsProps> = ({ setHideLayout }) => {
  const [ratingStats, setRatingStats] =
    useState<RatingStats>(defaultRatingStats);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [myRatings, setMyRatings] = useState<MyRating[]>([]);
  const [settings, setSettings] = useState<RatingSettings>(defaultSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  const [monthlyStats, setMonthlyStats] = useState<
    { month: string; count: number }[]
  >([]);
  const [topRaters, setTopRaters] = useState<
    { username: string; count: number }[]
  >([]);
  const [activeTab, setActiveTab] = useState<
    "overview" | "analytics" | "settings" | "public" | "customize"
  >("overview");
  const [isCustomizeFullscreen, setIsCustomizeFullscreen] = useState(false);

  const publicPageUrl = `${window.location.origin}/ratings/${
    settings.customLink || "your-username"
  }`;

  useEffect(() => {
    fetchRatings();
    fetchMyRatings();
    fetchSettings();
    setMonthlyStats([
      { month: "Jan", count: 3 },
      { month: "Feb", count: 5 },
      { month: "Mar", count: 2 },
      { month: "Apr", count: 7 },
      { month: "May", count: 4 },
      { month: "Jun", count: 6 },
    ]);
    setTopRaters([
      { username: "user1", count: 4 },
      { username: "user2", count: 3 },
      { username: "user3", count: 2 },
    ]);
  }, []);

  const fetchRatings = async () => {
    try {
      const response = await axios.get("/api/ratings/user/current");
      if (response.data) {
        setRatingStats({
          ...defaultRatingStats,
          ...response.data,
          distribution:
            response.data.distribution || defaultRatingStats.distribution,
          featured_quote:
            response.data.featured_quote || defaultRatingStats.featured_quote,
        });
        setRatings(response.data.ratings || []);
      }
    } catch (error) {
      console.error("Error fetching ratings:", error);
      toast.error("Failed to load ratings");
      setRatingStats(defaultRatingStats);
      setRatings([]);
    }
  };

  const fetchMyRatings = async () => {
    try {
      const response = await axios.get("/api/ratings/user/given");
      if (response.data && Array.isArray(response.data.ratings)) {
        setMyRatings(response.data.ratings);
      } else {
        setMyRatings([]);
      }
    } catch (error) {
      console.error("Error fetching my ratings:", error);
      toast.error("Failed to load your ratings");
      setMyRatings([]);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await axios.get("/api/ratings/settings");
      if (response.data) {
        setSettings({ ...defaultSettings, ...response.data });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    }
  };

  const updateSettings = async (newSettings: Partial<RatingSettings>) => {
    try {
      const response = await axios.put("/api/ratings/settings", newSettings);
      if (response.data) {
        setSettings((prev) => ({ ...prev, ...newSettings }));
        toast.success("Settings updated successfully");
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Failed to update settings");
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(publicPageUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const sections = useMemo(
    () => ({
      overview: (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#2b2b2b] rounded-2xl p-6 shadow-lg mb-6"
        >
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-400/10 p-2 rounded-lg">
                <Star className="w-5 h-5 text-yellow-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Ratings Overview</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 hover:bg-[#3a3a3a] rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5 text-[#9D8DFF]" />
              </button>
              <button
                onClick={copyToClipboard}
                className="p-2 hover:bg-[#3a3a3a] rounded-lg transition-colors"
              >
                {copied ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <Share2 className="w-5 h-5 text-[#9D8DFF]" />
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-[#2e2e2e] rounded-xl p-4">
              <div className="text-sm text-[#C4C4C7] mb-2">Average Rating</div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">
                  {ratingStats.average_rating.toFixed(1)}
                </span>
                <span className="text-sm text-[#9D8DFF]">out of 5</span>
              </div>
            </div>
            <div className="bg-[#2e2e2e] rounded-xl p-4">
              <div className="text-sm text-[#C4C4C7] mb-2">Total Ratings</div>
              <div className="text-3xl font-bold text-white">
                {ratingStats.total_ratings}
              </div>
            </div>
          </div>

          <div className="bg-[#2e2e2e] rounded-xl p-4 mb-6">
            <div className="text-sm text-[#C4C4C7] mb-4">
              Rating Distribution
            </div>
            <div className="space-y-3">
              {ratingStats.distribution.map((item) => (
                <div key={item.stars} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-[#C4C4C7]">{item.stars} stars</span>
                    </div>
                    <span className="text-[#9D8DFF]">{item.percentage}%</span>
                  </div>
                  <div className="h-2 bg-[#3a3a3a] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percentage}%` }}
                      transition={{ duration: 0.8 }}
                      className={`h-full rounded-full ${
                        item.stars > 3
                          ? "bg-emerald-500"
                          : item.stars < 2
                          ? "bg-rose-500"
                          : "bg-yellow-500"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {ratingStats.featured_quote.text !== "No ratings yet" && (
            <div className="bg-[#2e2e2e] rounded-xl p-4">
              <div className="text-sm text-[#C4C4C7] mb-2">Featured Quote</div>
              <div className="text-white italic mb-2">
                "{ratingStats.featured_quote.text}"
              </div>
              <div className="text-sm text-[#9D8DFF]">
                - {ratingStats.featured_quote.author}
              </div>
            </div>
          )}
        </motion.div>
      ),
      analytics: (
        <div className="bg-[#2b2b2b] rounded-2xl p-6 shadow-lg mb-6 mt-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>Analytics</span>
            <span className="text-xs text-[#9D8DFF]">(Advanced)</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="text-[#C4C4C7] mb-2">Ratings Distribution</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={ratingStats.distribution}>
                  <XAxis dataKey="stars" tick={{ fill: "#C4C4C7" }} />
                  <YAxis tick={{ fill: "#C4C4C7" }} allowDecimals={false} />
                  <Tooltip />
                  <Bar
                    dataKey="percentage"
                    fill="#9D8DFF"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <div className="text-[#C4C4C7] mb-2">Monthly Ratings</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={monthlyStats}>
                  <XAxis dataKey="month" tick={{ fill: "#C4C4C7" }} />
                  <YAxis tick={{ fill: "#C4C4C7" }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6C5DD3" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <div className="text-[#C4C4C7] mb-2">Top Raters</div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={topRaters}
                    dataKey="count"
                    nameKey="username"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    fill="#9D8DFF"
                    label
                  >
                    {topRaters.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`hsl(${
                          (index * 360) / topRaters.length
                        }, 70%, 60%)`}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#2b2b2b",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ),
      received: (
        <>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-1 bg-[#2b2b2b] rounded-2xl p-6 shadow-lg"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-[#9D8DFF]/10 p-2 rounded-lg">
                  <Settings className="w-5 h-5 text-[#9D8DFF]" />
                </div>
                <h2 className="text-xl font-bold text-white">
                  Rating Settings
                </h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-white">Enable Ratings</div>
                  <button
                    onClick={() =>
                      updateSettings({ enabled: !settings.enabled })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.enabled ? "bg-[#9D8DFF]" : "bg-[#3a3a3a]"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.enabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-white">Show Comments</div>
                  <button
                    onClick={() =>
                      updateSettings({ showComments: !settings.showComments })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.showComments ? "bg-[#9D8DFF]" : "bg-[#3a3a3a]"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.showComments
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-white">Show Only Positive Ratings</div>
                  <button
                    onClick={() =>
                      updateSettings({ onlyPositive: !settings.onlyPositive })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.onlyPositive ? "bg-[#9D8DFF]" : "bg-[#3a3a3a]"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.onlyPositive
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-white">Who Can Rate</div>
                  <select
                    value={settings.whoCanRate}
                    onChange={(e) =>
                      updateSettings({
                        whoCanRate: e.target
                          .value as RatingSettings["whoCanRate"],
                      })
                    }
                    className="bg-[#2e2e2e] text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#9D8DFF]"
                  >
                    <option value="all">Everyone</option>
                    <option value="recipients">Only Recipients</option>
                    <option value="verified">Verified Users</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-white">Email Notifications</div>
                  <button
                    onClick={() =>
                      updateSettings({
                        emailNotifications: !settings.emailNotifications,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.emailNotifications
                        ? "bg-[#9D8DFF]"
                        : "bg-[#3a3a3a]"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.emailNotifications
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <div className="text-white mb-1">Thank You Message</div>
                  <input
                    type="text"
                    value={settings.thankYouMessage}
                    onChange={(e) =>
                      updateSettings({ thankYouMessage: e.target.value })
                    }
                    className="bg-[#2e2e2e] text-white rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#9D8DFF]"
                    placeholder="Thank you for your rating!"
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-white">Custom Rating Link</div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={settings.customLink}
                      onChange={(e) =>
                        updateSettings({ customLink: e.target.value })
                      }
                      className="flex-1 bg-[#2e2e2e] text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#9D8DFF]"
                      placeholder="Enter custom link"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="p-2 bg-[#2e2e2e] rounded-lg hover:bg-[#3a3a3a] transition-colors"
                    >
                      {copied ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Copy className="w-5 h-5 text-[#9D8DFF]" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3 bg-[#2b2b2b] rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#9D8DFF]/10 p-2 rounded-lg">
                <Star className="w-5 h-5 text-[#9D8DFF]" />
              </div>
              <h2 className="text-xl font-bold text-white">Recent Ratings</h2>
            </div>

            <div className="space-y-4">
              {ratings.length > 0 ? (
                ratings.map((rating) => (
                  <div
                    key={rating.timestamp}
                    className="bg-[#2e2e2e] rounded-xl p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="text-white font-medium">
                          {settings.showRaterIdentity
                            ? rating.rater_username
                            : "Anonymous"}
                        </div>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < rating.stars
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-[#3a3a3a]"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="text-sm text-[#C4C4C7]">
                        {new Date(rating.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                    {settings.showComments && rating.comment && (
                      <div className="text-[#C4C4C7] text-sm mt-2">
                        {rating.comment}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center text-[#C4C4C7] py-8">
                  No ratings yet
                </div>
              )}
            </div>
          </motion.div>
        </>
      ),
      given: (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3 bg-[#2b2b2b] rounded-2xl p-6 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-[#9D8DFF]/10 p-2 rounded-lg">
              <Star className="w-5 h-5 text-[#9D8DFF]" />
            </div>
            <h2 className="text-xl font-bold text-white">Ratings You Gave</h2>
          </div>

          <div className="space-y-4">
            {myRatings.length > 0 ? (
              myRatings.map((rating) => (
                <div
                  key={rating.transaction_id}
                  className="bg-[#2e2e2e] rounded-xl p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="text-white font-medium">
                        {rating.username}
                      </div>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < rating.stars
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-[#3a3a3a]"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="text-sm text-[#C4C4C7]">
                      {new Date(rating.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                  {rating.comment && (
                    <div className="text-[#C4C4C7] text-sm mt-2">
                      {rating.comment}
                    </div>
                  )}
                  <div className="mt-2 text-sm text-[#9D8DFF]">
                    Amount sent: {rating.amount} coin
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-[#C4C4C7] py-8">
                You haven't rated anyone yet
              </div>
            )}
          </div>
        </motion.div>
      ),
      public: (
        <RatingsPublicDynamic ratingStats={ratingStats} ratings={ratings} />
      ),
      customize: (
        <CustomizeBuilder
          ratingStats={ratingStats}
          ratings={ratings}
          onFullscreenChange={setIsCustomizeFullscreen}
        />
      ),
      settings: (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#2b2b2b] rounded-2xl p-6 shadow-lg mb-6"
        >
          <h2 className="text-xl font-bold text-white mb-6">
            Ratings Settings
          </h2>
          {/* Who can rate you settings */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-[#9D8DFF] mb-4">
              Who Can Rate You
            </h3>
            <div className="space-y-6">
              {/* Enable/Disable receiving ratings */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">Enable Ratings</div>
                  <div className="text-sm text-[#C4C4C7]">
                    Allow others to rate you if enabled
                  </div>
                </div>
                <button
                  onClick={() => updateSettings({ enabled: !settings.enabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.enabled ? "bg-[#9D8DFF]" : "bg-[#3a3a3a]"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.enabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              {/* Who can rate you */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">
                    Who can rate you?
                  </div>
                  <div className="text-sm text-[#C4C4C7]">
                    Select who is allowed to rate you
                  </div>
                </div>
                <select
                  value={settings.whoCanRate}
                  onChange={(e) =>
                    updateSettings({
                      whoCanRate: e.target
                        .value as RatingSettings["whoCanRate"],
                    })
                  }
                  className="bg-[#2e2e2e] text-white rounded-lg px-3 py-1.5 border border-[#3a3a3a] focus:outline-none focus:border-[#9D8DFF]"
                >
                  <option value="all">Everyone</option>
                  <option value="recipients">Recipients Only</option>
                  <option value="verified">Verified Only</option>
                </select>
              </div>
              {/* Show/Hide rater identity */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">
                    Show Rater Identity
                  </div>
                  <div className="text-sm text-[#C4C4C7]">
                    Display the name of the person who rated you
                  </div>
                </div>
                <button
                  onClick={() =>
                    updateSettings({
                      showRaterIdentity: !settings.showRaterIdentity,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.showRaterIdentity ? "bg-[#9D8DFF]" : "bg-[#3a3a3a]"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.showRaterIdentity
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              {/* Show/Hide comments */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">Show Comments</div>
                  <div className="text-sm text-[#C4C4C7]">
                    Display rating comments to visitors
                  </div>
                </div>
                <button
                  onClick={() =>
                    updateSettings({ showComments: !settings.showComments })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.showComments ? "bg-[#9D8DFF]" : "bg-[#3a3a3a]"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.showComments ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              {/* Email notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">
                    Email Notifications
                  </div>
                  <div className="text-sm text-[#C4C4C7]">
                    Receive an email when you get a new rating
                  </div>
                </div>
                <button
                  onClick={() =>
                    updateSettings({
                      emailNotifications: !settings.emailNotifications,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.emailNotifications
                      ? "bg-[#9D8DFF]"
                      : "bg-[#3a3a3a]"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.emailNotifications
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              {/* Custom link */}
              <div className="space-y-2">
                <div className="text-white font-medium">
                  Custom Public Page Link
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settings.customLink}
                    onChange={(e) =>
                      updateSettings({ customLink: e.target.value })
                    }
                    placeholder="Custom link"
                    className="flex-1 bg-[#2e2e2e] text-white rounded-lg px-3 py-2 border border-[#3a3a3a] focus:outline-none focus:border-[#9D8DFF]"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="bg-[#9D8DFF] text-white px-4 py-2 rounded-lg hover:bg-[#8C6FE6] transition-colors"
                  >
                    {copied ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              {/* Allow multiple ratings */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">
                    Allow Multiple Ratings
                  </div>
                  <div className="text-sm text-[#C4C4C7]">
                    Can the same person rate you more than once?
                  </div>
                </div>
                <button
                  onClick={() =>
                    updateSettings({
                      allowMultipleRatings: !settings.allowMultipleRatings,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.allowMultipleRatings
                      ? "bg-[#9D8DFF]"
                      : "bg-[#3a3a3a]"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.allowMultipleRatings
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              {/* Require account to rate */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">
                    Require Account to Rate
                  </div>
                  <div className="text-sm text-[#C4C4C7]">
                    Must the rater have an account?
                  </div>
                </div>
                <button
                  onClick={() =>
                    updateSettings({ requireAccount: !settings.requireAccount })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.requireAccount ? "bg-[#9D8DFF]" : "bg-[#3a3a3a]"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.requireAccount
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
          {/* Settings for people you rate */}
          <div>
            <h3 className="text-lg font-semibold text-[#9D8DFF] mb-4">
              Settings for People You Rate
            </h3>
            <div className="space-y-6">
              {/* Allow reply to your rating */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">
                    Allow Reply to Your Rating
                  </div>
                  <div className="text-sm text-[#C4C4C7]">
                    Can the person you rate reply to your rating?
                  </div>
                </div>
                <button
                  onClick={() =>
                    updateSettings({ allowReply: !settings.allowReply })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.allowReply ? "bg-[#9D8DFF]" : "bg-[#3a3a3a]"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.allowReply ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              {/* Require approval before showing your rating */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">
                    Require Approval Before Showing Your Rating
                  </div>
                  <div className="text-sm text-[#C4C4C7]">
                    Do you want to review your rating before it appears to the
                    other party?
                  </div>
                </div>
                <button
                  onClick={() =>
                    updateSettings({
                      requireApproval: !settings.requireApproval,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.requireApproval ? "bg-[#9D8DFF]" : "bg-[#3a3a3a]"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.requireApproval
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              {/* Future options placeholder */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">Future Options</div>
                  <div className="text-sm text-[#C4C4C7]">
                    More settings will be added soon
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ),
    }),
    [
      ratingStats,
      monthlyStats,
      topRaters,
      ratings,
      myRatings,
      showSettings,
      settings,
      copied,
      publicPageUrl,
    ]
  );

  if (activeTab === "customize") {
    return (
      <div className="min-h-screen w-full bg-[#262626] overflow-x-hidden">
        <div className="w-full">
          <div className="flex items-center justify-between mb-6 mt-0">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-400/10 p-2 rounded-lg">
                <Star className="w-5 h-5 text-yellow-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Ratings</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 hover:bg-[#3a3a3a] rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5 text-[#9D8DFF]" />
              </button>
            </div>
          </div>
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {["overview", "analytics", "settings", "public", "customize"].map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as typeof activeTab)}
                  className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === tab
                      ? "bg-[#9D8DFF] text-white"
                      : "bg-[#2b2b2b] text-[#C4C4C7] hover:bg-[#3a3a3a]"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              )
            )}
          </div>
          <AnimatePresence mode="wait">
            {activeTab === "overview" && sections.overview}
            {activeTab === "analytics" && sections.analytics}
            {activeTab === "settings" && sections.settings}
            {activeTab === "public" && sections.public}
            {activeTab === "customize" && sections.customize}
          </AnimatePresence>
        </div>
      </div>
    );
  } else {
    return (
      <div className="min-h-screen bg-[#262626] p-4">
        <div className="max-w-7xl mx-auto">
          {!isCustomizeFullscreen ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-400/10 p-2 rounded-lg">
                    <Star className="w-5 h-5 text-yellow-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Ratings</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 hover:bg-[#3a3a3a] rounded-lg transition-colors"
                  >
                    <Settings className="w-5 h-5 text-[#9D8DFF]" />
                  </button>
                </div>
              </div>
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {[
                  "overview",
                  "analytics",
                  "settings",
                  "public",
                  "customize",
                ].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as typeof activeTab)}
                    className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                      activeTab === tab
                        ? "bg-[#9D8DFF] text-white"
                        : "bg-[#2b2b2b] text-[#C4C4C7] hover:bg-[#3a3a3a]"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setIsCustomizeFullscreen(false)}
                className="p-2 hover:bg-[#3a3a3a] rounded-lg transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#9D8DFF]"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setActiveTab("public")}
                className="px-4 py-2 bg-[#9D8DFF] text-white rounded-lg hover:bg-[#8C6FE6] transition-colors"
              >
                View Public Page
              </button>
            </div>
          )}
          <AnimatePresence mode="wait">
            {activeTab === "overview" && sections.overview}
            {activeTab === "analytics" && sections.analytics}
            {activeTab === "settings" && sections.settings}
            {activeTab === "public" && sections.public}
            {activeTab === "customize" && sections.customize}
          </AnimatePresence>
        </div>
      </div>
    );
  }
};

const widgetList = [
  { id: "totalRatings", name: "Total Ratings" },
  { id: "starDistribution", name: "Star Distribution" },
  { id: "comments", name: "Comments" },
  { id: "profilePicture", name: "Profile Picture" },
  { id: "featuredQuote", name: "Featured Quote" },
  { id: "verifiedBadge", name: "Verified Badge" },
];

// تعريف أنواع مخصصة
interface ContactLink {
  label: string;
  url: string;
}
interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}
interface WidgetStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  boxShadow?: string;
  fontFamily?: string;
  fontSize?: string;
  textColor?: string;
}
interface WidgetSettingsBase {
  title: string;
  color: string;
  visible: boolean;
  font?: string;
  size?: string;
  align?: string;
  style?: WidgetStyle;
}
interface ProfilePictureSettings extends WidgetSettingsBase {
  imageUrl: string;
}
interface ContactLinksSettings extends WidgetSettingsBase {
  links: ContactLink[];
}
interface CustomTextSettings extends WidgetSettingsBase {
  text: string;
}
type WidgetSettings = WidgetSettingsBase &
  Partial<ProfilePictureSettings & ContactLinksSettings & CustomTextSettings>;

// Dictionaries for encoding/decoding
const WIDGETS_DICT = {
  totalRatings: "01",
  starDistribution: "02",
  comments: "03",
  profilePicture: "04",
  featuredQuote: "05",
  verifiedBadge: "06",
};
const COLORS_DICT = {
  "#000000": "00",
  "#FFFFFF": "01",
  "#9D8DFF": "02",
  "#60A5FA": "03",
  "#4ADE80": "04",
  "#F59E42": "05",
};
const FONTS_DICT = {
  Arial: "00",
  Roboto: "01",
  Montserrat: "02",
  Tahoma: "03",
};
const SIZES_DICT = {
  small: "01",
  medium: "02",
  large: "03",
};
const ALIGN_DICT = {
  left: "00",
  center: "01",
  right: "02",
};

// Reverse dictionaries (فقط ما نحتاجه)
const WIDGETS_DICT_REV = Object.fromEntries(
  Object.entries(WIDGETS_DICT).map(([k, v]) => [v, k])
);
const COLORS_DICT_REV = Object.fromEntries(
  Object.entries(COLORS_DICT).map(([k, v]) => [v, k])
);

// Encoding/Decoding functions
function encodeWidget(
  id: keyof typeof WIDGETS_DICT,
  settings: WidgetSettings,
  pos: { x: number; y: number }
): string {
  return [
    WIDGETS_DICT[id],
    String(pos?.x ?? 0).padStart(3, "0"),
    String(pos?.y ?? 0).padStart(3, "0"),
    COLORS_DICT[settings.color as keyof typeof COLORS_DICT] || "00",
    FONTS_DICT[(settings.font as keyof typeof FONTS_DICT) || "Arial"] || "00",
    SIZES_DICT[(settings.size as keyof typeof SIZES_DICT) || "medium"] || "02",
    ALIGN_DICT[(settings.align as keyof typeof ALIGN_DICT) || "center"] || "01",
  ].join("-");
}
function encodePage(
  widgets: string[],
  widgetSettings: Record<string, WidgetSettings>,
  widgetPositions: Record<string, { x: number; y: number }>
): string {
  return widgets
    .map((id) =>
      encodeWidget(
        id as keyof typeof WIDGETS_DICT,
        widgetSettings[id],
        widgetPositions[id] || { x: 0, y: 0 }
      )
    )
    .join("|");
}

function CustomizeBuilder({
  ratingStats,
  ratings,
  onFullscreenChange,
}: {
  ratingStats: RatingStats;
  ratings: Rating[];
  onFullscreenChange: (isFullscreen: boolean) => void;
}) {
  const defaultWidgets = [
    "totalRatings",
    "starDistribution",
    "comments",
    "profilePicture",
    "verifiedBadge",
  ];
  const defaultWidgetSettings: Record<string, WidgetSettings> = {
    totalRatings: { title: "Total Ratings", color: "#9D8DFF", visible: true },
    starDistribution: {
      title: "Star Distribution",
      color: "#FFD600",
      visible: true,
    },
    comments: { title: "Comments", color: "#6C5DD3", visible: true },
    profilePicture: {
      title: "Profile Picture",
      color: "#23232a",
      visible: true,
      imageUrl: "https://ui-avatars.com/api/?name=User",
    },
    featuredQuote: { title: "Featured Quote", color: "#23232a", visible: true },
    verifiedBadge: { title: "Verified Badge", color: "#4ADE80", visible: true },
    contactLinks: {
      title: "Contact Links",
      color: "#60A5FA",
      visible: true,
      links: [{ label: "Twitter", url: "https://twitter.com/" }],
    },
    customText: {
      title: "Custom Text",
      color: "#9D8DFF",
      visible: true,
      text: "Welcome to my ratings page!",
    },
  };

  const [widgets, setWidgets] = useState<string[]>(() => {
    const saved = localStorage.getItem("custom_widgets");
    return saved ? JSON.parse(saved) : defaultWidgets;
  });
  const [widgetSettings, setWidgetSettings] = useState<
    Record<string, WidgetSettings>
  >(() => {
    const saved = localStorage.getItem("custom_widget_settings");
    return saved ? JSON.parse(saved) : defaultWidgetSettings;
  });
  const [dragged, setDragged] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [importJson, setImportJson] = useState("");
  const [widgetPositions, setWidgetPositions] = useState<
    Record<string, WidgetPosition>
  >({});
  const [resizing, setResizing] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 });
  const [pageStyle, setPageStyle] = useState<WidgetStyle>({
    backgroundColor: "#23232a",
    borderColor: "#3a3a3a",
    borderWidth: 1,
    borderRadius: 12,
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    fontFamily: "Arial",
    fontSize: "16px",
    textColor: "#ffffff",
  });
  const [pageCode, setPageCode] = useState("");

  // تحديث الكود الرقمي عند أي تغيير
  useEffect(() => {
    setPageCode(encodePage(widgets, widgetSettings, widgetPositions));
  }, [widgets, widgetSettings, widgetPositions]);

  const handleDragStart = (id: string, e: React.DragEvent) => {
    setDragged(id);

    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleDrag = (id: string, e: React.DragEvent) => {
    if (!dragged || !e.clientX || !e.clientY) return;

    const container = e.currentTarget.closest(".grid-container");
    if (!container) return;

    const rect = container.getBoundingClientRect();

    const x = Math.floor((e.clientX - rect.left - dragOffset.x) / CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top - dragOffset.y) / CELL_SIZE);

    const boundedX = Math.max(0, Math.min(x, GRID_SIZE - 1));
    const boundedY = Math.max(0, Math.min(y, GRID_SIZE - 1));

    setWidgetPositions((prev) => ({
      ...prev,
      [id]: { x: boundedX, y: boundedY },
    }));
  };

  const handleDragEnd = () => {
    setDragged(null);
    setDragOffset({ x: 0, y: 0 });
  };

  const handleSidebarDrop = (id: string) => {
    if (!widgets.includes(id)) {
      setWidgets([...widgets, id]);
    }
    setDragged(null);
    setDragOverId(null);
  };
  const handleRemove = (id: string) => {
    setWidgets(widgets.filter((w) => w !== id));
    if (selected === id) setSelected(null);
  };
  const handleSelect = (id: string) => setSelected(id);
  const handleSettingChange = (
    key: keyof WidgetSettings,
    value: string | boolean | ContactLink[]
  ) => {
    if (!selected) return;
    setWidgetSettings((prev) => ({
      ...prev,
      [selected]: {
        ...prev[selected],
        [key]: value,
      },
    }));
  };

  const handleExport = () => {
    const data = JSON.stringify({ widgets, widgetSettings }, null, 2);
    navigator.clipboard.writeText(data);
    alert("Customization exported to clipboard!");
  };
  const handleImport = () => {
    try {
      const data = JSON.parse(importJson);
      if (
        Array.isArray(data.widgets) &&
        typeof data.widgetSettings === "object"
      ) {
        setWidgets(data.widgets);
        setWidgetSettings(data.widgetSettings);
        alert("Customization imported!");
      } else {
        alert("Invalid JSON format");
      }
    } catch {
      alert("Invalid JSON");
    }
  };

  const handleResizeStart = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setResizing(id);
    setResizeStart({ x: e.clientX, y: e.clientY });
  };

  const handleResize = (id: string, e: React.MouseEvent) => {
    if (!resizing) return;

    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;

    setWidgetPositions((prev) => {
      const current = prev[id] || { x: 0, y: 0, width: 200, height: 100 };
      const newWidth = Math.max(100, current.width + deltaX);
      const newHeight = Math.max(50, current.height + deltaY);

      return {
        ...prev,
        [id]: {
          ...current,
          width: newWidth,
          height: newHeight,
        },
      };
    });

    setResizeStart({ x: e.clientX, y: e.clientY });
  };

  const handleResizeEnd = () => {
    setResizing(null);
  };

  const renderWidget = (id: string) => {
    const settings = widgetSettings[id];
    if (!settings?.visible) return null;
    switch (id) {
      case "totalRatings":
        return (
          <div className="flex items-center gap-3">
            <span
              className="text-3xl font-bold"
              style={{ color: settings.color }}
            >
              {ratingStats?.total_ratings ?? 0}
            </span>
            <span className="text-lg text-[#C4C4C7]">{settings.title}</span>
          </div>
        );
      case "starDistribution":
        return (
          <div>
            <div className="mb-2 text-[#C4C4C7]">{settings.title}</div>
            <div className="flex flex-col gap-2">
              {(ratingStats?.distribution || []).map((item) => (
                <div key={item.stars} className="flex items-center gap-2">
                  <span className="w-8 text-sm text-[#FFD600]">
                    {item.stars}★
                  </span>
                  <div className="flex-1 h-2 bg-[#3a3a3a] rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${item.percentage}%`,
                        background: settings.color,
                      }}
                      className="h-full rounded-full transition-all"
                    ></div>
                  </div>
                  <span className="w-8 text-sm text-[#C4C4C7]">
                    {item.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      case "comments":
        return (
          <div>
            <div className="mb-2 text-[#C4C4C7]">{settings.title}</div>
            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
              {(ratings || [])
                .filter((r) => r.comment)
                .map((r, i) => (
                  <div
                    key={i}
                    className="bg-[#23232a] rounded p-2 text-sm text-white"
                  >
                    <span className="font-bold text-[#9D8DFF]">
                      {r.rater_username}:
                    </span>{" "}
                    {r.comment}
                  </div>
                ))}
              {(!ratings || ratings.filter((r) => r.comment).length === 0) && (
                <div className="text-[#C4C4C7]">No comments yet</div>
              )}
            </div>
          </div>
        );
      case "profilePicture":
        return (
          <div className="flex flex-col items-center gap-2">
            <img
              src={settings.imageUrl}
              alt="Profile"
              className="w-20 h-20 rounded-full border-4"
              style={{ borderColor: settings.color }}
            />
            <span className="text-white text-sm">{settings.title}</span>
          </div>
        );
      case "featuredQuote":
        return (
          <div className="italic text-white text-center">
            "{ratingStats?.featured_quote?.text || "No featured quote yet"}"
            <div className="text-[#9D8DFF] mt-2">
              - {ratingStats?.featured_quote?.author || ""}
            </div>
          </div>
        );
      case "verifiedBadge":
        return (
          <div className="flex items-center gap-2">
            <span className="inline-block w-6 h-6 rounded-full bg-[#4ADE80] flex items-center justify-center text-white font-bold">
              ✔
            </span>
            <span className="text-white">{settings.title}</span>
          </div>
        );
      case "contactLinks":
        return (
          <div>
            <div className="mb-2 text-[#C4C4C7]">{settings.title}</div>
            <div className="flex gap-2 flex-wrap">
              {settings.links &&
                settings.links.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 rounded bg-[#18181c] text-[#60A5FA] border border-[#60A5FA] hover:bg-[#60A5FA] hover:text-white transition"
                  >
                    {link.label}
                  </a>
                ))}
            </div>
          </div>
        );
      case "customText":
        return (
          <div
            className="text-white text-center text-lg"
            style={{ color: settings.color }}
          >
            {settings.text}
          </div>
        );
      default:
        return null;
    }
  };

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const GRID_SIZE = 24;
  const CELL_SIZE = 40;

  useEffect(() => {
    onFullscreenChange(true);
    return () => onFullscreenChange(false);
  }, [onFullscreenChange]);

  return (
    <div className="flex w-full h-full gap-0 overflow-hidden">
      {/* الشريط الجانبي */}
      <div className="w-72 bg-[#23232a] flex flex-col h-full shadow-xl border-r border-[#18181c]">
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-lg font-bold text-white mb-4">Widgets</h3>
          {widgetList.map((widget) => (
            <div
              key={widget.id}
              draggable
              onDragStart={(e) => handleDragStart(widget.id, e)}
              onDrag={(e) => handleDrag(widget.id, e)}
              onDragEnd={handleDragEnd}
              className={`p-3 rounded-lg cursor-grab bg-[#2b2b2b] text-white border border-transparent hover:border-[#9D8DFF] transition ${
                dragged === widget.id ? "opacity-50" : ""
              }`}
            >
              {widget.name}
            </div>
          ))}
        </div>
        {/* خيارات Page Style بأسفل الشريط الجانبي */}
        <div className="p-4 border-t border-[#3a3a3a]">
          <h3 className="text-base font-bold text-white mb-2">Page Style</h3>
          <div className="space-y-2">
            <div>
              <label className="block text-[#C4C4C7] mb-1">Background</label>
              <input
                type="color"
                value={pageStyle.backgroundColor}
                onChange={(e) =>
                  setPageStyle((prev) => ({
                    ...prev,
                    backgroundColor: e.target.value,
                  }))
                }
                className="w-full h-8 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[#C4C4C7] mb-1">Font</label>
              <select
                value={pageStyle.fontFamily}
                onChange={(e) =>
                  setPageStyle((prev) => ({
                    ...prev,
                    fontFamily: e.target.value,
                  }))
                }
                className="w-full bg-[#2e2e2e] text-white rounded-lg px-3 py-2"
              >
                <option value="Arial">Arial</option>
                <option value="Roboto">Roboto</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Tahoma">Tahoma</option>
              </select>
            </div>
            <div>
              <label className="block text-[#C4C4C7] mb-1">Font Size</label>
              <select
                value={pageStyle.fontSize}
                onChange={(e) =>
                  setPageStyle((prev) => ({
                    ...prev,
                    fontSize: e.target.value,
                  }))
                }
                className="w-full bg-[#2e2e2e] text-white rounded-lg px-3 py-2"
              >
                <option value="14px">Small</option>
                <option value="16px">Medium</option>
                <option value="18px">Large</option>
                <option value="20px">X-Large</option>
              </select>
            </div>
          </div>
        </div>
        {/* زر التصدير والاستيراد بأسفل الشريط الجانبي */}
        <div className="p-4 border-t border-[#3a3a3a] flex flex-col gap-2">
          <button
            onClick={handleExport}
            className="bg-[#60A5FA] text-white px-4 py-2 rounded-lg hover:bg-[#2563EB] transition-colors font-bold"
          >
            Export
          </button>
          <textarea
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            placeholder="Paste JSON here to import"
            className="w-full bg-[#18181c] text-white rounded-lg px-3 py-2 border border-[#3a3a3a] min-h-[60px]"
          />
          <button
            onClick={handleImport}
            className="bg-[#4ADE80] text-white px-4 py-2 rounded-lg hover:bg-[#22C55E] transition-colors font-bold"
          >
            Import
          </button>
          <button
            onClick={() => {
              setWidgets(defaultWidgets);
              setWidgetSettings(defaultWidgetSettings);
              localStorage.removeItem("custom_widgets");
              localStorage.removeItem("custom_widget_settings");
            }}
            className="bg-[#23232a] border border-[#9D8DFF] text-[#9D8DFF] px-4 py-2 rounded-lg hover:bg-[#18181c] transition-colors font-bold"
          >
            Reset to Default
          </button>
          <button
            onClick={() => window.prompt("Page Code:", pageCode)}
            className="bg-[#FFD600] text-black px-4 py-2 rounded-lg hover:bg-[#F59E42] transition-colors font-bold"
          >
            Show Page Code
          </button>
        </div>
      </div>
      {/* منطقة العرض */}
      <div className="flex-1 bg-[#18181c] h-full relative flex flex-col">
        <h2 className="text-xl font-bold text-white mb-0 px-0 pt-0">
          Public Page Preview
        </h2>
        <div
          className="grid-container relative w-full h-full"
          style={{
            backgroundImage: `linear-gradient(${pageStyle.borderColor} 1px, transparent 1px),linear-gradient(90deg, ${pageStyle.borderColor} 1px, transparent 1px)`,
            backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
            backgroundColor: pageStyle.backgroundColor,
            borderRadius: `${pageStyle.borderRadius}px`,
            boxShadow: pageStyle.boxShadow,
            fontFamily: pageStyle.fontFamily,
            fontSize: pageStyle.fontSize,
            color: pageStyle.textColor,
            minHeight: 0,
            height: "100%",
            overflow: "auto",
          }}
        >
          {widgets.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-[#C4C4C7]">
              Drag widgets here to build your public page
            </div>
          )}
          {widgets.map((id) => {
            const settings = widgetSettings[id];
            const position = widgetPositions[id] || {
              x: 0,
              y: 0,
              width: 200,
              height: 100,
            };
            const style = settings.style || {};
            if (!settings?.visible) return null;
            return (
              <div
                key={id}
                draggable
                onDragStart={(e) => handleDragStart(id, e)}
                onDrag={(e) => handleDrag(id, e)}
                onDragEnd={handleDragEnd}
                className={`absolute bg-[#2b2b2b] rounded-xl p-4 cursor-move transition-all duration-150 ${
                  selected === id ? "ring-2 ring-[#9D8DFF]" : ""
                } ${dragged === id ? "scale-105 shadow-lg" : ""}`}
                style={{
                  left: `${position.x * CELL_SIZE}px`,
                  top: `${position.y * CELL_SIZE}px`,
                  width: `${position.width}px`,
                  height: `${position.height}px`,
                  backgroundColor: style.backgroundColor || "#2b2b2b",
                  borderColor: style.borderColor || "transparent",
                  borderWidth: style.borderWidth || 0,
                  borderRadius: `${style.borderRadius || 12}px`,
                  boxShadow: style.boxShadow || "none",
                  fontFamily: style.fontFamily || pageStyle.fontFamily,
                  fontSize: style.fontSize || pageStyle.fontSize,
                  color: style.textColor || pageStyle.textColor,
                  zIndex: selected === id ? 10 : 1,
                  transition: "all 0.15s",
                }}
                onClick={() => handleSelect(id)}
              >
                {renderWidget(id)}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(id);
                  }}
                  className="absolute top-1 right-1 text-[#9D8DFF] hover:text-red-500"
                  title="Remove"
                >
                  ×
                </button>
                <div
                  className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
                  onMouseDown={(e) => handleResizeStart(id, e)}
                  onMouseMove={(e) => handleResize(id, e)}
                  onMouseUp={handleResizeEnd}
                  onMouseLeave={handleResizeEnd}
                >
                  <div className="w-2 h-2 border-b-2 border-r-2 border-[#9D8DFF] absolute bottom-1 right-1" />
                </div>
              </div>
            );
          })}
        </div>
        {/* إعدادات الودجت */}
        {selected && (
          <div className="fixed top-24 right-8 w-80 bg-[#23232a] rounded-2xl p-6 shadow-2xl border border-[#9D8DFF] z-50 flex flex-col gap-4">
            <h4 className="text-lg font-bold text-white mb-4">
              Widget Settings
            </h4>
            {/* إعدادات Style ... */}
            <div className="mb-6">
              <h5 className="text-[#C4C4C7] mb-3">Style Settings</h5>
              <div className="space-y-4">{/* ... إعدادات style ... */}</div>
            </div>
            {/* إعدادات عامة ... */}
            <div className="mb-4">
              <label className="block text-[#C4C4C7] mb-1">Title</label>
              <input
                type="text"
                value={widgetSettings[selected].title}
                onChange={(e) => handleSettingChange("title", e.target.value)}
                className="w-full bg-[#2e2e2e] text-white rounded-lg px-3 py-2 border border-[#3a3a3a] focus:outline-none focus:border-[#9D8DFF]"
              />
            </div>
            <div className="mb-4">
              <label className="block text-[#C4C4C7] mb-1">Color</label>
              <input
                type="color"
                value={widgetSettings[selected].color}
                onChange={(e) => handleSettingChange("color", e.target.value)}
                className="w-12 h-8 p-0 border-none bg-transparent"
              />
            </div>
            <div className="mb-4 flex items-center gap-2">
              <input
                type="checkbox"
                checked={widgetSettings[selected].visible}
                onChange={(e) =>
                  handleSettingChange("visible", e.target.checked)
                }
                id="visible-checkbox"
              />
              <label htmlFor="visible-checkbox" className="text-[#C4C4C7]">
                Visible
              </label>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleRemove(selected)}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors w-1/2"
              >
                Remove Widget
              </button>
              <button
                onClick={() => setSelected(null)}
                className="bg-[#9D8DFF] text-white px-4 py-2 rounded-lg hover:bg-[#8C6FE6] transition-colors w-1/2"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- RatingsPublicDynamic ---
const GRID_SIZE = 24;
const CELL_SIZE = 40;

interface RatingsPublicDynamicProps {
  ratingStats: RatingStats;
  ratings: Rating[];
}

function RatingsPublicDynamic({
  ratingStats,
  ratings,
}: RatingsPublicDynamicProps) {
  // --- دوال فك الترميز ---
  const WIDGETS_DICT_REV: Record<string, string> = {
    "01": "totalRatings",
    "02": "starDistribution",
    "03": "comments",
    "04": "profilePicture",
    "05": "featuredQuote",
    "06": "verifiedBadge",
  };
  const COLORS_DICT_REV: Record<string, string> = {
    "00": "#000000",
    "01": "#FFFFFF",
    "02": "#9D8DFF",
    "03": "#60A5FA",
    "04": "#4ADE80",
    "05": "#F59E42",
  };
  const FONTS_DICT_REV: Record<string, string> = {
    "00": "Arial",
    "01": "Roboto",
    "02": "Montserrat",
    "03": "Tahoma",
  };
  const SIZES_DICT_REV: Record<string, string> = {
    "01": "small",
    "02": "medium",
    "03": "large",
  };
  const ALIGN_DICT_REV: Record<string, string> = {
    "00": "left",
    "01": "center",
    "02": "right",
  };

  function decodeWidget(code: string) {
    const [wid, x, y, w, h, color, font, size, align] = code.split("-");
    return {
      id: WIDGETS_DICT_REV[wid],
      pos: {
        x: Number(x),
        y: Number(y),
        width: Number(w),
        height: Number(h),
      },
      settings: {
        color: COLORS_DICT_REV[color],
        font: FONTS_DICT_REV[font],
        size: SIZES_DICT_REV[size],
        align: ALIGN_DICT_REV[align],
      },
    };
  }

  function decodePage(pageCode: string) {
    if (!pageCode) return [];
    return pageCode.split("|").map(decodeWidget);
  }
  // --- نهاية دوال فك الترميز ---

  // جلب الكود الرقمي من localStorage أو API
  const [pageCode, setPageCode] = React.useState<string>("");
  const [widgets, setWidgets] = React.useState<any[]>([]);

  React.useEffect(() => {
    const code = localStorage.getItem("public_page_code") || "";
    setPageCode(code);
    setWidgets(decodePage(code));
  }, []);

  // دالة رسم كل ودجت حسب النوع
  function renderWidget(widget: any) {
    switch (widget.id) {
      case "totalRatings":
        return (
          <div className="flex items-center gap-3">
            <span
              className="text-3xl font-bold"
              style={{ color: widget.settings.color }}
            >
              {ratingStats?.total_ratings ?? 0}
            </span>
            <span className="text-lg text-[#C4C4C7]">Total Ratings</span>
          </div>
        );
      case "starDistribution":
        return (
          <div>
            <div className="mb-2 text-[#C4C4C7]">Star Distribution</div>
            <div className="flex flex-col gap-2">
              {(ratingStats?.distribution || []).map((item) => (
                <div key={item.stars} className="flex items-center gap-2">
                  <span className="w-8 text-sm text-[#FFD600]">
                    {item.stars}★
                  </span>
                  <div className="flex-1 h-2 bg-[#3a3a3a] rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${item.percentage}%`,
                        background: widget.settings.color,
                      }}
                      className="h-full rounded-full transition-all"
                    ></div>
                  </div>
                  <span className="w-8 text-sm text-[#C4C4C7]">
                    {item.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      case "comments":
        return (
          <div>
            <div className="mb-2 text-[#C4C4C7]">Comments</div>
            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
              {(ratings || [])
                .filter((r) => r.comment)
                .map((r, i) => (
                  <div
                    key={i}
                    className="bg-[#23232a] rounded p-2 text-sm text-white"
                  >
                    <span className="font-bold text-[#9D8DFF]">
                      {r.rater_username}:
                    </span>{" "}
                    {r.comment}
                  </div>
                ))}
              {(!ratings || ratings.filter((r) => r.comment).length === 0) && (
                <div className="text-[#C4C4C7]">No comments yet</div>
              )}
            </div>
          </div>
        );
      case "profilePicture":
        return (
          <div className="flex flex-col items-center gap-2">
            <img
              src={"https://ui-avatars.com/api/?name=User"}
              alt="Profile"
              className="w-20 h-20 rounded-full border-4"
              style={{ borderColor: widget.settings.color }}
            />
            <span className="text-white text-sm">Profile Picture</span>
          </div>
        );
      case "featuredQuote":
        return (
          <div className="italic text-white text-center">
            "{ratingStats?.featured_quote?.text || "No featured quote yet"}"
            <div className="text-[#9D8DFF] mt-2">
              - {ratingStats?.featured_quote?.author || ""}
            </div>
          </div>
        );
      case "verifiedBadge":
        return (
          <div className="flex items-center gap-2">
            <span className="inline-block w-6 h-6 rounded-full bg-[#4ADE80] flex items-center justify-center text-white font-bold">
              ✔
            </span>
            <span className="text-white">Verified Badge</span>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-[#18181c] flex items-center justify-center">
      <div
        className="relative w-full max-w-5xl h-[900px] rounded-xl mx-auto"
        style={{
          backgroundImage: `linear-gradient(#3a3a3a 1px, transparent 1px),linear-gradient(90deg, #3a3a3a 1px, transparent 1px)`,
          backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
        }}
      >
        {widgets.map((widget, idx) => (
          <div
            key={idx}
            className="absolute bg-[#2b2b2b] rounded-xl p-4 transition-all"
            style={{
              left: `${widget.pos.x * CELL_SIZE}px`,
              top: `${widget.pos.y * CELL_SIZE}px`,
              width: `${widget.pos.width}px`,
              height: `${widget.pos.height}px`,
              color: widget.settings.color,
              fontFamily: widget.settings.font,
              textAlign: widget.settings.align as any,
            }}
          >
            {renderWidget(widget)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Ratings;
