import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, ArrowRight } from "lucide-react";
import NexTalkLogo from "../../components/NexTalkLogo";
import { forgotPassword } from "../../api/auth/login";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      setMessageType("error");
      setMessage("Please enter your email address.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setMessageType("error");
      setMessage(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-stone-50 to-amber-50">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <NexTalkLogo className="w-16 h-16" />
        </div>

        {sent ? (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-7 h-7 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900 mb-2">Check your email</h2>
            <p className="text-stone-500 text-sm mb-6">
              We sent a password reset link to <span className="font-medium text-stone-700">{email}</span>.
              Check your inbox and follow the link.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-8">
            <h2 className="text-2xl font-bold text-stone-900 mb-1">Forgot password?</h2>
            <p className="text-stone-500 text-sm mb-6">
              Enter your email and we'll send you a reset link.
            </p>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-11 pr-4 py-3 border border-stone-200 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all duration-200"
                />
              </div>
            </div>

            {message && (
              <div className={`mt-4 p-3 rounded-xl border ${
                messageType === "success" ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"
              }`}>
                <p className={`text-sm ${messageType === "success" ? "text-green-600" : "text-red-600"}`}>
                  {message}
                </p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="mt-5 w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:ring-offset-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Send reset link
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <div className="mt-5 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-amber-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
