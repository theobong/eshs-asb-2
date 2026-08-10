import { useState, useEffect } from "react";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getVideos, type VideoPost } from "@/lib/api";
import { UniversalPageLayout } from "@/components/UniversalPageLayout";
import { BlurContainer, BlurCard, BlurActionButton } from "@/components/UniversalBlurComponents";

const toYouTubeEmbedUrl = (videoUrl: string) => {
  if (videoUrl.includes('youtube.com/watch')) {
    const videoId = videoUrl.split('v=')[1]?.split('&')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  if (videoUrl.includes('youtu.be/')) {
    const videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  return videoUrl;
};

const formatDate = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const getAuthorInitials = (author: string) =>
  (author || '')
    .split(' ')
    .filter(Boolean)
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

const formatViews = (views: number | undefined) => (views ?? 0).toLocaleString();

const BirdsEyeView = () => {
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVideos = async () => {
      try {
        setLoading(true);
        const data = await getVideos();
        setVideos(data);
        const featured = data.find(video => video.featured) || data[0];
        setSelectedVideo(featured || null);
        setError(null);
      } catch (err) {
        console.error('Failed to load videos:', err);
        setError('Failed to load videos. Please try again later.');
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    loadVideos();
  }, []);

  const handleVideoSelect = (video: VideoPost) => {
    setSelectedVideo(video);
    if (window.innerWidth < 768) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <UniversalPageLayout pageType="information" title="Bird's Eye View">
      {({ contentVisible }) => (
        <>
          {error && (
            <BlurContainer contentVisible={contentVisible} delay="150ms" className="mb-8 p-4 border-red-400/50">
              <div className="border-red-400/50 bg-red-500/20 p-4 rounded-lg">
                <div className="flex items-center text-red-400 text-sm mb-2">
                  <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Error Loading Content
                </div>
                <p className="text-red-100">{error}</p>
                <BlurActionButton
                  contentVisible={contentVisible}
                  onClick={() => window.location.reload()}
                  className="mt-2 min-h-11 px-4 text-sm justify-center"
                >
                  Retry
                </BlurActionButton>
              </div>
            </BlurContainer>
          )}

          {loading ? (
            <BlurContainer contentVisible={contentVisible} delay="150ms" className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white/90">Loading videos...</p>
            </BlurContainer>
          ) : videos.length === 0 ? (
            !error && (
              <BlurContainer contentVisible={contentVisible} delay="150ms" className="text-center py-16">
                <p className="text-white/90 text-lg mb-1">No videos yet</p>
                <p className="text-gray-300 text-sm">Check back soon for the latest Bird&apos;s Eye View episodes.</p>
              </BlurContainer>
            )
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2 space-y-4">
                {selectedVideo ? (
                  <BlurContainer contentVisible={contentVisible} delay="200ms" className="rounded-xl overflow-hidden">
                    <div className="aspect-video bg-black rounded-t-xl overflow-hidden">
                      <iframe
                        src={toYouTubeEmbedUrl(selectedVideo.videoUrl)}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                        title={selectedVideo.title}
                      />
                    </div>
                    <div className="p-4 sm:p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 break-words">
                            {selectedVideo.title}
                          </h2>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-300 mb-3">
                            <div className="flex items-center space-x-2 min-w-0">
                              <Avatar className="w-6 h-6 flex-shrink-0">
                                <AvatarFallback className="text-xs bg-blue-600 text-white">
                                  {getAuthorInitials(selectedVideo.author)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate">{selectedVideo.author}</span>
                            </div>
                            <span>{formatViews(selectedVideo.views)} views</span>
                            <span>{formatDate(selectedVideo.date)}</span>
                          </div>
                          {selectedVideo.featured && (
                            <div className="flex items-center space-x-2 mb-4">
                              <Badge variant="secondary" className="bg-yellow-600/20 text-yellow-300 border-yellow-500/30">
                                Featured
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-200 leading-relaxed break-words">
                        {selectedVideo.description}
                      </p>
                    </div>
                  </BlurContainer>
                ) : (
                  <BlurContainer contentVisible={contentVisible} delay="200ms" className="rounded-xl overflow-hidden">
                    <div className="aspect-video bg-gray-800/50 rounded-t-xl flex items-center justify-center">
                      <p className="text-gray-300">Select a video to watch</p>
                    </div>
                  </BlurContainer>
                )}
              </div>

              <div className="space-y-4">
                <BlurContainer contentVisible={contentVisible} delay="200ms" className="p-4">
                  <h3 className="text-white font-semibold mb-2">All Videos</h3>
                </BlurContainer>

                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {videos.map((video, index) => (
                    <BlurCard
                      key={video._id}
                      contentVisible={contentVisible}
                      index={index}
                      delay={`${300 + (index * 50)}ms`}
                      className={`cursor-pointer hover:bg-white/10 hover:border-blue-500/50 ${
                        selectedVideo?._id === video._id ? 'ring-2 ring-blue-500 bg-white/10' : ''
                      }`}
                      onClick={() => handleVideoSelect(video)}
                    >
                      <CardContent className="p-3">
                        <div className="flex space-x-3">
                          <div className="relative flex-shrink-0">
                            <img
                              src={video.thumbnailUrl}
                              alt={video.title}
                              loading="lazy"
                              width={64}
                              height={48}
                              className="w-16 h-12 object-cover rounded bg-gray-700"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.style.visibility = 'hidden';
                              }}
                            />
                            {video.featured && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-white text-sm line-clamp-2 mb-1">
                              {video.title}
                            </h3>
                            <div className="flex items-center justify-between text-xs text-gray-300">
                              <span>{formatViews(video.views)} views</span>
                              <span>{formatDate(video.date)}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </BlurCard>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </UniversalPageLayout>
  );
};

export default BirdsEyeView;
