import { useEffect, useState } from "react";
import { UserWithStories } from "./StoryScroller";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface StoryContentProps {
  setDialogOpen: (open: boolean) => void;
  storyData?: UserWithStories;
}

const StoryContent = ({ setDialogOpen, storyData }: StoryContentProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const stories = storyData?.stories || [];

  useEffect(() => {
    if (stories.length === 0) return;

    const timer = setTimeout(() => {
      if (currentIndex < stories.length - 1) {
        triggerTransition(() => setCurrentIndex((prev) => prev + 1));
      } else {
        setDialogOpen(false);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [currentIndex, stories.length, setDialogOpen]);

  const triggerTransition = (callback: () => void) => {
    setIsAnimating(true);
    setTimeout(() => {
      callback();
      setIsAnimating(false);
    }, 150);
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      triggerTransition(() => setCurrentIndex((prev) => prev - 1));
    }
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      triggerTransition(() => setCurrentIndex((prev) => prev + 1));
    } else {
      setDialogOpen(false);
    }
  };

  const canGoPrev = stories.length > 1 && currentIndex > 0;
  const canGoNext = stories.length > 1 && currentIndex < stories.length - 1;
  const showArrows = stories.length > 1;

  if (stories.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-full text-white">
        No stories available.
      </div>
    );
  }

  return (
    <div className="relative flex flex-col w-full h-full justify-center items-center space-y-2 px-4">
      {/* Progress bar */}
      <div className="h-1 w-full bg-gray-300 rounded overflow-hidden mt-6 mb-3">
        <div
          className="h-full bg-[#189FF2] animate-progress"
          style={{ animationDuration: "3s", animationFillMode: "forwards" }}
        />
      </div>

      {/* User Info */}
      <div className="w-full flex items-center gap-3 mb-4">
        <Link to={`/profile/${storyData?.user.id}`}>
          <Avatar className="w-12 h-12 ring-2 ring-[#189FF2]">
            <AvatarImage
              src={storyData?.user.avatarUrl}
              alt={`user-avatar-${storyData?.user.id}`}
            />
          </Avatar>
        </Link>
        <Link to={`/profile/${storyData?.user.id}`}>
          <p className="font-medium text-sm text-white">
            {storyData?.user.username}
          </p>
        </Link>
      </div>

      {/* Story image with optional arrows */}
      <div className="relative w-full flex justify-center items-center">
        {showArrows && (
          <button
            onClick={handlePrev}
            disabled={!canGoPrev}
            className={`absolute left-0 z-10 p-2 text-white rounded-full ${
              canGoPrev
                ? "hover:bg-[#2b3a4599]"
                : "opacity-30 cursor-not-allowed"
            }`}
          >
            <ChevronLeft size={30} />
          </button>
        )}

        <img
          key={stories[currentIndex]?.id}
          src={stories[currentIndex]?.content}
          alt={`story-${currentIndex}`}
          className={`w-[60%] max-h-[300px] object-contain transition-all duration-300 ease-in-out ${
            isAnimating ? "opacity-0 scale-95" : "opacity-100 scale-100"
          }`}
        />

        {showArrows && (
          <button
            onClick={handleNext}
            disabled={!canGoNext}
            className={`absolute right-0 z-10 p-2 text-white rounded-full ${
              canGoNext
                ? "hover:bg-[#2b3a4599]"
                : "opacity-30 cursor-not-allowed"
            }`}
          >
            <ChevronRight size={30} />
          </button>
        )}
      </div>
    </div>
  );
};

export default StoryContent;
