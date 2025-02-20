import { useState } from "react";
import { Loader2 } from "lucide-react";

const ImageWithLoader = ({ src, alt, messageEndRef }) => {
  const [isLoading, setIsLoading] = useState(true);

  const handleImageLoad = () => {
    setIsLoading(false);
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative sm:max-w-[200px] rounded-md mb-2">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-md">
          <Loader2 className="animate-spin text-purple-600 size-8" />
        </div>
      )}

      <img
        src={src}
        alt={alt}
        className={`rounded-md ${isLoading ? "invisible" : "visible"}`}
        onLoad={handleImageLoad}
      />
    </div>
  );
};

export default ImageWithLoader;
