import { getMyHelpfulMessages } from "@/api/community";

export default function useHelpfulMessages(communityId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await getMyHelpfulMessages(communityId);
    setMessages(res.data.data.messages);
    setLoading(false);
  };

  return { messages, loading, reload: load };
}
