import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { StudentGovPosition, getStudentGovPositions } from "@/lib/api";
import { UniversalPageLayout } from "@/components/UniversalPageLayout";
import { BlurContainer, BlurCard, BlurActionButton } from "@/components/UniversalBlurComponents";

const positionCategories = [
  { value: "officer", label: "Officer" },
  { value: "senior", label: "Senior" },
  { value: "junior", label: "Junior" },
  { value: "sophomore", label: "Sophomore" },
  { value: "freshman", label: "Freshman" },
  { value: "committee", label: "Committee" },
  { value: "birds eye", label: "Birds Eye" },
  { value: "tech", label: "Tech" },
  { value: "culture and diversity", label: "Culture and Diversity" },
  { value: "spirit", label: "Spirit" },
  { value: "publicity", label: "Publicity" },
  { value: "clubs", label: "Clubs" },
  { value: "athletics", label: "Athletics" },
  { value: "student/staff", label: "Student/Staff" },
  { value: "special projects", label: "Special Projects" },
  { value: "performance", label: "Performance" },
];

const governmentResources = [
  {
    title: "Petition To Run",
    description: "Information about running for student government positions",
    link: "#petition-to-run"
  },
  {
    title: "Teacher Recommendation Forms",
    description: "Required forms for student government candidacy",
    link: "#recommendation-forms"
  },
  {
    title: "ASB Handbook",
    description: "Student government handbook and guidelines",
    link: "#asb-handbook"
  },
  {
    title: "Meeting Minutes",
    description: "Access to student council meeting minutes and records",
    link: "#meeting-minutes"
  }
];

const categoryOf = (position: StudentGovPosition) =>
  (position.gradeLevel || "").toLowerCase();

export default function Elections() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [positions, setPositions] = useState<StudentGovPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        setLoading(true);
        const data = await getStudentGovPositions();
        setPositions(data);
      } catch (err) {
        setError('Failed to load student government positions');
        console.error('Error fetching student government positions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPositions();
  }, []);

  const handleBackClick = () => {
    setLocation("/information");
  };

  const filteredPositions = selectedCategory === "all"
    ? positions
    : positions.filter(position => categoryOf(position) === selectedCategory);

  const extraCategories = Array.from(new Set(
    positions
      .map(categoryOf)
      .filter(level => level !== "" && !positionCategories.some(category => category.value === level))
  )).map(level => ({
    value: level,
    label: level.replace(/\b\w/g, (c) => c.toUpperCase()),
  }));
  const categoryOptions = [...positionCategories, ...extraCategories];

  if (loading) {
    return (
      <UniversalPageLayout pageType="information" title="Student Government" onBackClick={handleBackClick}>
        {({ contentVisible }) => (
          <BlurContainer contentVisible={contentVisible} className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <div className="text-white text-xl">Loading student government positions...</div>
          </BlurContainer>
        )}
      </UniversalPageLayout>
    );
  }

  if (error) {
    return (
      <UniversalPageLayout pageType="information" title="Student Government" onBackClick={handleBackClick}>
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
    <UniversalPageLayout
      pageType="information"
      title="Student Government"
      backButtonText="Back"
      onBackClick={handleBackClick}
    >
      {({ contentVisible }) => (
        <>
          <BlurContainer contentVisible={contentVisible} delay="200ms" className="p-4 sm:p-6 mb-8 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold mb-2 break-words">Student Government Representatives</h2>
                <p className="mb-4">Meet your student government representatives and learn about their roles in representing your voice at school.</p>
              </div>
              <div className="mt-6 md:mt-0 h-24 w-24 flex-shrink-0 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                <svg className="h-12 w-12 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </BlurContainer>

          <div className="mb-8 max-w-md mx-auto">
            <label htmlFor="category-filter" className="block text-sm font-medium text-gray-200 mb-2">
              Filter by category
            </label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full min-h-11 rounded-lg bg-white/5 border border-white/10 shadow-lg text-white text-base px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer"
            >
              <option value="all" className="bg-gray-900 text-white">All</option>
              {categoryOptions.map((category) => (
                <option key={category.value} value={category.value} className="bg-gray-900 text-white">
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-8">
            {filteredPositions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredPositions.map((position, index) => (
                  <BlurCard
                    key={position._id}
                    contentVisible={contentVisible}
                    index={index}
                    delay={`${500 + (index * 50)}ms`}
                  >
                    <div className="p-4 sm:p-6">
                      <div className="flex justify-between items-start gap-2 mb-4">
                        <div className="min-w-0">
                          <h3 className="text-xl font-semibold text-white mb-2 break-words">{position.position}</h3>
                          <p className="text-gray-300 mb-3">{position.description}</p>
                        </div>
                        <Badge variant="outline" className="flex-shrink-0 capitalize">
                          {position.gradeLevel}
                        </Badge>
                      </div>

                      {position.currentRepresentatives && position.currentRepresentatives.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-200 mb-3">Current Representative(s):</h4>
                          {position.currentRepresentatives.map((rep, repIndex) => (
                            <div key={`${position._id}-${repIndex}`} className="p-3 sm:p-4 bg-white/5 rounded-lg border border-white/10 mb-3">
                              <div className="flex items-start gap-3 sm:gap-4">
                                {rep.image && (
                                  <img
                                    src={rep.image}
                                    alt={rep.name}
                                    loading="lazy"
                                    className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-full object-cover border-2 border-white/20"
                                    onError={(e) => {
                                      e.currentTarget.onerror = null;
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-semibold text-lg break-words">{rep.name}</p>
                                  {rep.email && (
                                    <p className="text-sm text-gray-300 break-words">{rep.email}</p>
                                  )}
                                  {rep.bio && (
                                    <p className="text-sm text-gray-200 mt-2 break-words">{rep.bio}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </BlurCard>
                ))}
              </div>
            ) : (
              <BlurContainer contentVisible={contentVisible} delay="400ms" className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-white">No positions found</h3>
                <p className="mt-1 text-sm text-gray-300">
                  There are currently no positions listed for this category.
                </p>
              </BlurContainer>
            )}
          </div>

          <h2 className="text-2xl font-bold text-white mb-6">Student Government Resources</h2>
          <BlurContainer contentVisible={contentVisible} delay="700ms" className="p-4 sm:p-6 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {governmentResources.map((resource, index) => (
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

          <h2 className="text-2xl font-bold text-white mb-6">Student Government FAQ</h2>
          <BlurContainer contentVisible={contentVisible} delay="1100ms" className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="border-b border-white/10 pb-4">
                <h3 className="font-semibold mb-2 text-white">How can I contact my class representative?</h3>
                <p className="text-gray-300">You can reach out to your class representatives via email or find them around campus.</p>
              </div>
              <div className="border-b border-white/10 pb-4">
                <h3 className="font-semibold mb-2 text-white">When does student government meet?</h3>
                <p className="text-gray-300">Every school day during fourth period in Mrs. Richmond's room (B101).</p>
              </div>
            </div>
          </BlurContainer>
        </>
      )}
    </UniversalPageLayout>
  );
}
