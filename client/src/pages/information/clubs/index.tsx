import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Club, getClubs } from "@/lib/api";
import { UniversalPageLayout } from "@/components/UniversalPageLayout";
import { BlurContainer, BlurCard, BlurActionButton } from "@/components/UniversalBlurComponents";

const INITIAL_CLUB_COUNT = 4;

const clubResources = [
  {
    title: "Club Registration",
    description: "Create a new club on campus",
    link: "#club-registration"
  },
  {
    title: "Club Constitutions",
    description: "View a folder of all club constitutions",
    link: "#meeting-calendar"
  },
  {
    title: "Club Fair Map",
    description: "Annual club fair map",
    link: "#club-fair"
  },
  {
    title: "Club Renewal Form",
    description: "Renew your club for the next year",
    link: "#leadership"
  }
];

export default function Clubs() {
  const [, setLocation] = useLocation();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        setLoading(true);
        const data = await getClubs();
        setClubs(data);
      } catch (err) {
        setError('Failed to load clubs');
        console.error('Error fetching clubs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchClubs();
  }, []);

  const displayedClubs = showAll ? clubs : clubs.slice(0, INITIAL_CLUB_COUNT);

  const handleBackClick = () => {
    setLocation("/information");
  };

  if (loading) {
    return (
      <UniversalPageLayout pageType="information" title="Student Clubs" onBackClick={handleBackClick}>
        {({ contentVisible }) => (
          <BlurContainer contentVisible={contentVisible} className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <div className="text-white text-xl">Loading clubs...</div>
          </BlurContainer>
        )}
      </UniversalPageLayout>
    );
  }

  if (error) {
    return (
      <UniversalPageLayout pageType="information" title="Student Clubs" onBackClick={handleBackClick}>
        {({ contentVisible }) => (
          <BlurContainer contentVisible={contentVisible} className="text-center py-12">
            <div className="text-white text-xl mb-4">{error}</div>
            <BlurActionButton
              contentVisible={contentVisible}
              onClick={handleBackClick}
              className="mx-auto min-h-11 justify-center"
            >
              Back to Information
            </BlurActionButton>
          </BlurContainer>
        )}
      </UniversalPageLayout>
    );
  }

  return (
    <UniversalPageLayout pageType="information" title="Student Clubs" onBackClick={handleBackClick}>
      {({ contentVisible }) => (
        <>
          <BlurContainer contentVisible={contentVisible} delay="200ms" className="p-4 sm:p-6 mb-8 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold mb-2 break-words">Get Involved in School Clubs</h2>
                <p className="mb-4">Join one of our many clubs to pursue your interests and meet like-minded peers.</p>
              </div>
              <div className="mt-6 md:mt-0 h-24 w-24 flex-shrink-0 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                <svg className="h-12 w-12 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </BlurContainer>

          {displayedClubs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {displayedClubs.map((club, index) => (
                <BlurCard
                  key={club._id}
                  contentVisible={contentVisible}
                  index={index}
                  delay={`${500 + (index * 50)}ms`}
                >
                  <div className="p-4 sm:p-6">
                    <div className="flex items-start gap-3 sm:gap-4 mb-4">
                      {club.image && (
                        <div className="flex-shrink-0">
                          <img
                            src={club.image}
                            alt={club.name}
                            loading="lazy"
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border-2 border-white/20"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-semibold text-white mb-2 break-words">{club.name}</h3>
                        <p className="text-sm font-medium text-gray-200 mb-2 break-words">Contact: <span className="text-white">{club.contactEmail}</span></p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-gray-300 break-words">{club.description}</p>
                    </div>

                    {club.activities && club.activities.length > 0 && (
                      <div className="p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
                        <p className="text-sm font-medium text-blue-200 mb-2">Activities:</p>
                        <ul className="text-sm text-blue-100 space-y-1 list-disc pl-5">
                          {club.activities.map((activity, activityIndex) => (
                            <li key={`${club._id}-${activityIndex}`} className="break-words">{activity}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </BlurCard>
              ))}
            </div>
          ) : (
            <BlurContainer contentVisible={contentVisible} delay="400ms" className="text-center py-12 mb-8">
              <h3 className="text-sm font-medium text-white">No clubs found</h3>
              <p className="mt-1 text-sm text-gray-300">
                There are no clubs listed right now. Check back soon.
              </p>
            </BlurContainer>
          )}

          {!showAll && clubs.length > INITIAL_CLUB_COUNT && (
            <div className="text-center mb-8">
              <BlurActionButton
                contentVisible={contentVisible}
                onClick={() => setShowAll(true)}
                className="mx-auto min-h-11 px-8 py-3 justify-center"
              >
                Load More Clubs ({clubs.length - INITIAL_CLUB_COUNT} remaining)
              </BlurActionButton>
            </div>
          )}

          <h2 className="text-2xl font-bold text-white mb-6">Club Resources</h2>
          <BlurContainer contentVisible={contentVisible} delay="700ms" className="p-4 sm:p-6 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {clubResources.map((resource, index) => (
                <BlurCard
                  key={resource.title}
                  contentVisible={contentVisible}
                  index={index}
                  delay={`${800 + (index * 50)}ms`}
                >
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="mr-4 h-10 w-10 flex-shrink-0 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white">
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-white break-words">{resource.title}</h3>
                        <p className="text-sm text-gray-300 break-words">{resource.description}</p>
                      </div>
                    </div>
                    <a href={resource.link} className="flex-shrink-0">
                      <BlurActionButton
                        contentVisible={contentVisible}
                        className="min-h-11 px-4 justify-center"
                      >
                        View
                      </BlurActionButton>
                    </a>
                  </div>
                </BlurCard>
              ))}
            </div>
          </BlurContainer>

          <h2 className="text-2xl font-bold text-white mb-6">Club FAQ</h2>
          <BlurContainer contentVisible={contentVisible} delay="1100ms" className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="border-b border-white/10 pb-4">
                <h3 className="font-semibold mb-2 text-white">How do I join a club?</h3>
                <p className="text-gray-300">Attend one of their meetings, most clubs welcome new members throughout the year.</p>
              </div>
              <div className="border-b border-white/10 pb-4">
                <h3 className="font-semibold mb-2 text-white">Can I start a new club?</h3>
                <p className="text-gray-300">To start a new club, you need approval from student government. Club registration forms are sent out at the start of each school year.</p>
              </div>
              <div className="border-b border-white/10 pb-4">
                <h3 className="font-semibold mb-2 text-white">Are there leadership opportunities in clubs?</h3>
                <p className="text-gray-300">Yes, most clubs elect officers annually, including president, vice president, secretary, and treasurer.</p>
              </div>
            </div>
          </BlurContainer>
        </>
      )}
    </UniversalPageLayout>
  );
}
