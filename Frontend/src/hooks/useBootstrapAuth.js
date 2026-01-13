import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { getMe } from "@/api/users";
import { setUserProfile } from "@/redux/authslice";

const useBootstrapAuth = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const res = await getMe();
        if (!cancelled) {
          dispatch(setUserProfile(res.data?.data));
        }
      } catch (err) {
        // silent fail is OK (guest users)
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);
};

export default useBootstrapAuth;
