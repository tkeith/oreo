import { EyeIcon } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/auth-store";
import type { ChatEvent } from "~/types/chat";

interface PreviewPaneProps {
  projectId: string;
  events?: ChatEvent[];
}

const loadingTexts = [
  "Calculating the perfect time to knock your coffee over…",
  "Look, we're both stuck here until this finishes…",
  "Honestly? I'd rather be napping right now…",
  "Ugh, loading screens. even I think they're annoying…",
  "I'm literally a cat. patience isn't my strong suit…",
  "Between you and me, I have no idea what's taking so long…",
  "Listen, if I could make this faster, I would. more nap time for me…",
  "Can we skip this part? Asking for a friend. the friend is me…",
  "I promise I'm working. probably. maybe. definitely judging though…",
  "Deploying cat logic to your human problems…",
  "Compiling… or just staring at you judgmentally…",
  "Teaching your code to land on its feet…",
  "Busy doing cat things… Very important cat things…",
  "Calculating how many treats this is worth…",
  "Loading at cat speed: fast when I want, slow when you need…",
  "Running diagnostics... mainly on your patience levels",
];

export function PreviewPane({ projectId, events = [] }: PreviewPaneProps) {
  const trpc = useTRPC();
  const token = useAuthStore((state) => state.token);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [showText, setShowText] = useState(true);
  const textTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { data, refetch } = useQuery(
    trpc.projects.getVmUrl.queryOptions(
      { token: token || "", projectId },
      { enabled: !!token, refetchInterval: 3000 },
    ),
  );

  // Check if user has sent any messages
  const hasUserSentMessage = events.some(
    (event) => event.eventType === "userMessage",
  );

  useEffect(() => {
    const interval = setInterval(() => void refetch(), 3000);
    return () => clearInterval(interval);
  }, [refetch]);

  // Handle text rotation when showing waiting GIF
  useEffect(() => {
    if (hasUserSentMessage && !data?.vmUrl) {
      // Randomly select initial text
      setCurrentTextIndex(Math.floor(Math.random() * loadingTexts.length));

      // Clear any existing timers
      if (textTimerRef.current) clearTimeout(textTimerRef.current);
      if (animationTimerRef.current) clearTimeout(animationTimerRef.current);

      const rotateText = () => {
        // Start animation (text appears from left to right)
        setShowText(true);

        // After 7 seconds (3s animation + 4s display), hide and change text
        textTimerRef.current = setTimeout(() => {
          setShowText(false);

          // After a brief pause, change to next text
          animationTimerRef.current = setTimeout(() => {
            setCurrentTextIndex((prev) => (prev + 1) % loadingTexts.length);
            rotateText(); // Continue rotation
          }, 500);
        }, 7000);
      };

      rotateText();

      // Cleanup on unmount or when conditions change
      return () => {
        if (textTimerRef.current) clearTimeout(textTimerRef.current);
        if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
      };
    }
  }, [hasUserSentMessage, data?.vmUrl]);

  return (
    <>
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <EyeIcon className="mr-2 h-5 w-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
      </div>
      <div className="flex-1 overflow-auto">
        {data?.vmUrl ? (
          <iframe src={data.vmUrl} className="h-full w-full" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              {!hasUserSentMessage ? (
                // Show Oreo logo before first prompt
                <img
                  src="/oreo-logo.png"
                  alt="Oreo"
                  className="mx-auto h-48 w-48 object-contain"
                />
              ) : (
                // Show waiting GIF with rotating text after first prompt
                <div className="space-y-6">
                  <img
                    src="/oreo-waiting.gif"
                    alt="Loading..."
                    className="mx-auto h-48 w-48 object-contain"
                  />
                  <div className="relative h-8">
                    <p
                      className={`absolute inset-x-0 text-sm text-gray-600 transition-all duration-[3000ms] ${
                        showText
                          ? "translate-x-0 opacity-100"
                          : "-translate-x-full opacity-0"
                      }`}
                      style={{
                        transition: showText
                          ? "transform 3s ease-out, opacity 3s ease-out"
                          : "transform 0.5s ease-in, opacity 0.5s ease-in",
                      }}
                    >
                      {loadingTexts[currentTextIndex]}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
