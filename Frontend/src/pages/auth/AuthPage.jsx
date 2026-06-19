import { useEffect, useState, useRef } from "react";
import { loginRequest, registerRequest, googleLoginRequest } from "@/api/auth";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setAuthUser } from "@/redux/authslice";
import toast from "react-hot-toast";

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

  // Track whether the GSI SDK script has fully loaded
  const gsiReady = useRef(false);

  /* -------------------------------------------------------
      GOOGLE SDK LOADER — runs once on mount
      When the script loads we set gsiReady so the render
      effect below can pick it up.
  ---------------------------------------------------------*/
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const initAndRender = () => {
      if (!window.google) return;
      gsiReady.current = true;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });
      renderGoogleButton();
    };

    // Script already loaded (e.g. hot-reload)
    if (window.google) {
      initAndRender();
      return;
    }

    if (document.getElementById("google-sdk")) {
      // Script tag exists but hasn't fired onload yet — wait for it
      document.getElementById("google-sdk").addEventListener("load", initAndRender);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.id = "google-sdk";
    script.async = true;
    script.defer = true;
    script.onload = initAndRender;
    document.body.appendChild(script);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* -------------------------------------------------------
      Re-render the Google button every time the user
      switches back to the Sign In tab.
  ---------------------------------------------------------*/
  useEffect(() => {
    if (tab === "signin") {
      // The div is freshly mounted — render into it
      renderGoogleButton();
    }
  }, [tab]);

  function renderGoogleButton() {
    if (!window.google?.accounts?.id) return;
    const el = document.getElementById("googleBtn");
    if (!el) return;
    window.google.accounts.id.renderButton(el, {
      theme: "outline",
      size: "large",
      width: "100%",
      shape: "pill",
    });
  }

  const onChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  /* ------------------------ SIGN IN ------------------------ */
  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const payload = {
        identifier: form.identifier,
        password: form.password,
      };

      const res = await loginRequest(payload);

      const { user, accessToken, refreshToken } = res.data.data;

      localStorage.setItem("userId", user._id);
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      dispatch(setAuthUser({ user, accessToken, refreshToken }));
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------ GOOGLE LOGIN ------------------------ */
  async function handleGoogleResponse(response) {
    try {
      setLoading(true);

      const res = await googleLoginRequest(response.credential);
      const { user, accessToken, refreshToken } = res.data.data;

      localStorage.setItem("userId", user._id);
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      dispatch(setAuthUser({ user, accessToken, refreshToken }));
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Google login failed");
    } finally {
      setLoading(false);
    }
  }

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

      await registerRequest(payload);

      toast.success("Account created! Please sign in.");
      setTab("signin");
      setForm((p) => ({ ...p, identifier: form.username }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Sign up failed");
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

                {/* GOOGLE BUTTON — always rendered, never conditionally removed */}
                <div id="googleBtn" className="w-full min-h-[44px]" />
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

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
                      Or sign in with
                    </span>
                  </div>
                </div>

                {/* Prompt to switch to Sign In for Google */}
                <p className="text-center text-sm text-gray-500">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setTab("signin")}
                    className="text-[#40E0D0] font-semibold hover:underline"
                  >
                    Sign in with Google
                  </button>
                </p>
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
