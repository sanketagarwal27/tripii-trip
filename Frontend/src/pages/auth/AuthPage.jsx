import { useEffect, useState } from "react";
import { loginRequest, registerRequest, googleLoginRequest } from "@/api/auth";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setAuthUser } from "@/redux/authslice";

export default function AuthPage() {
  const [tab, setTab] = useState("signin");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    identifier: "",
    password: "",
    username: "",
    email: "",
  });

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  /* -------------------------------------------------------
      GOOGLE SDK LOADER
  ---------------------------------------------------------*/
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    if (document.getElementById("google-sdk")) return; // prevent multiple loads

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.id = "google-sdk";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });
        window.google.accounts.id.renderButton(
          document.getElementById("googleBtn"),
          {
            theme: "outline",
            size: "large",
            width: "100%",
            shape: "pill",
          }
        );
      }
    };

    document.body.appendChild(script);
  }, []);

  /* -------------------------------------------------------
      GOOGLE LOGIN HANDLER - 🔥 UPDATED WITH LOCALSTORAGE
  ---------------------------------------------------------*/
  async function handleGoogleResponse(response) {
    try {
      setLoading(true);

      const res = await googleLoginRequest(response.credential);
      console.log("Google Login success:", res);
      const { user, accessToken, refreshToken } = res.data.data;

      // 🔥 Store userId in localStorage for socket connection
      localStorage.setItem("userId", user._id);
      console.log("✅ Stored userId in localStorage:", user._id);

      dispatch(
        setAuthUser({
          user,
          accessToken,
          refreshToken,
        })
      );

      // redirect to homepage
      navigate("/");
    } catch (err) {
      console.error("Google Login Error:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  }

  const onChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  /* ------------------------ SIGN IN - 🔥 UPDATED ------------------------ */
  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const payload = {
        identifier: form.identifier,
        password: form.password,
      };

      const res = await loginRequest(payload);
      console.log("Login success:", res.data);

      // 🔥 Store userId in localStorage for socket connection
      const { user, accessToken, refreshToken } = res.data.data;
      localStorage.setItem("userId", user._id);
      console.log("✅ Stored userId in localStorage:", user._id);

      dispatch(setAuthUser(res.data.data));

      // redirect
      navigate("/");
    } catch (err) {
      console.error("Login error:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------ SIGN UP ------------------------ */
  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const payload = {
        username: form.username,
        email: form.email,
        password: form.password,
      };

      const res = await registerRequest(payload);
      console.log("Signup success:", res.data);

      setTab("signin");
      setForm((p) => ({ ...p, identifier: form.username }));
    } catch (err) {
      console.error("Signup error:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------ UI ------------------------------ */

  return (
    <div className="min-h-screen w-full bg-[#FDF5E6] grid grid-cols-1 lg:grid-cols-2">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex relative">
        <img
          src="/authbg.jpg"
          alt="TripiiTrip adventure"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/10" />

        <div className="absolute bottom-12 left-12 text-white max-w-md drop-shadow-xl">
          <h1 className="text-5xl font-extrabold leading-tight">
            Your Next Adventure Awaits
          </h1>
          <p className="mt-4 text-lg text-white/90">
            TripiiTrip — plan smarter, explore deeper, and travel with the
            people who matter.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex items-center justify-center py-10 px-6 sm:px-12 lg:px-16">
        <div className="w-full max-w-md">
          {/* BRAND */}
          <div className="flex items-center justify-center mb-10">
            <span className="material-symbols-outlined text-[#40E0D0] text-5xl mr-2">
              travel_explore
            </span>
            <div>
              <div className="text-3xl font-black text-[#003366]">
                TripiiTrip
              </div>
              <div className="text-[12px] tracking-wide text-gray-500">
                travel · connect · explore
              </div>
            </div>
          </div>

          {/* CARD */}
          <div className="bg-white shadow-lg rounded-2xl p-8 border border-orange-200">
            {/* TABS */}
            <div className="grid grid-cols-2 bg-[#FFF7F0] p-1 rounded-xl mb-7 shadow-inner">
              <button
                onClick={() => setTab("signin")}
                className={`py-3 rounded-lg font-bold transition ${
                  tab === "signin"
                    ? "bg-[#40E0D0] text-white shadow-md"
                    : "text-[#003366] hover:bg-white/50"
                }`}
              >
                Sign In
              </button>

              <button
                onClick={() => setTab("signup")}
                className={`py-3 rounded-lg font-bold transition ${
                  tab === "signup"
                    ? "bg-[#40E0D0] text-white shadow-md"
                    : "text-[#003366] hover:bg-white/50"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* SIGN IN FORM */}
            {tab === "signin" && (
              <form
                className="space-y-5 animate-fadeIn"
                onSubmit={handleSignIn}
              >
                <div>
                  <label className="font-semibold text-[#003366] text-sm">
                    Username or Email
                  </label>
                  <input
                    type="text"
                    required
                    name="identifier"
                    value={form.identifier}
                    onChange={onChange}
                    className="mt-1 w-full border-2 border-gray-300 rounded-xl px-4 py-3
                      focus:ring-[#40E0D0]/20 focus:border-[#40E0D0]"
                    placeholder="your username or email"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#003366] text-sm">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    name="password"
                    value={form.password}
                    onChange={onChange}
                    className="mt-1 w-full border-2 border-gray-300 rounded-xl px-4 py-3
                      focus:ring-[#40E0D0]/20 focus:border-[#40E0D0]"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#40E0D0] text-white font-bold rounded-xl hover:opacity-90 shadow-md transition"
                >
                  {loading ? "Please wait..." : "Sign In"}
                </button>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
                      Or continue with
                    </span>
                  </div>
                </div>

                {/* GOOGLE BUTTON */}
                <div id="googleBtn" className="w-full" />
              </form>
            )}

            {/* SIGN UP FORM */}
            {tab === "signup" && (
              <form
                className="space-y-5 animate-fadeIn"
                onSubmit={handleSignUp}
              >
                <div>
                  <label className="font-semibold text-[#003366] text-sm">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    name="username"
                    value={form.username}
                    onChange={onChange}
                    className="mt-1 w-full border-2 border-gray-300 rounded-xl px-4 py-3"
                    placeholder="choose a handle"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#003366] text-sm">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    name="email"
                    value={form.email}
                    onChange={onChange}
                    className="mt-1 w-full border-2 border-gray-300 rounded-xl px-4 py-3"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#003366] text-sm">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    name="password"
                    value={form.password}
                    onChange={onChange}
                    className="mt-1 w-full border-2 border-gray-300 rounded-xl px-4 py-3"
                    placeholder="choose a strong password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#40E0D0] text-white font-bold rounded-xl hover:opacity-90 shadow-md transition"
                >
                  {loading ? "Please wait..." : "Create Account"}
                </button>
              </form>
            )}
          </div>

          <p className="text-center text-xs text-gray-500 mt-5">
            By continuing, you agree to the{" "}
            <span className="text-[#40E0D0] font-medium">Terms</span> &{" "}
            <span className="text-[#40E0D0] font-medium">Privacy Policy</span>.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.35s ease-out; }
      `}</style>
    </div>
  );
}
