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
const committees = [
  { name: "Tech Specialist", lead: "Anthony Marsico", members: ["None"],
  description: "Hey Eagles!  I’m Anthony Marsico, head of tech for ASB and I help run all of our school assemblies and control music and projection in these assemblies.  In addition to the school assemblies, I’m also working on a new school website and handle any technology related task within ASB.  Fun fact, my committee is the only one person committee in ASB.",
  image: "/Tech.jpg",
  },
  { name: "Birds Eye", lead: "Brandon Kim", members: ["Jake DiMaria", "Ben Lopez"], 
  description: "Hi, we’re the Birds Eye Committee!!  We are all over campus making your favorite monthly school videos. We always put 110% effort in every video we  make and hope you enjoy them!",
  image: "/Birds Eye JPG.jpg",
  },
  { name: "Culture and Diversity", lead: "Dione Bell", members: ["Emma Navarro"],
  description: "Hey eagles! We are your Culture and Diversity committee. Dione Bell is commissioner and Emma Navarro is co-commissioner. Together we promote diversity and on campus unity. We also use every morning announcement to talk about a special event or recognize someone. We support and coordinate events such as Red Ribbon Week, as well as new clubs, programs, activities and assemblies that promote tolerance of all diverse groups.",
  image: "/culture-and-diversity.jpg",
  },
  { name: "Spirit", lead: "Alana Gutierrez", members: ["Sean Helms", "Marilyn McCaverty"],
  description: "Hey Eagles!  We are the spirit commissioners and we plan all of the fun spirit events on campus. We plan the LTAs, Spirit days, pep rallies, and themes for your favorite sports events! We help bring your creative ideas to life. We love spreading that Eagle pride in the classroom and out. Don’t forget to dress up for EVERY SINGLE SPIRIT DAY!!!!!!",
  image: "/Spirit.jpg",
  },
  { name: "Publicity", lead: "Joey Parisi", members: ["Alyssa Lieberstein", "Odin Thomas"],
  description: "As the Publicity & Public Relations Committee, our job is to make sure students know what’s happening around campus and get excited about upcoming events. We create flyers, posters, work on bulletin boards, displays, and other promotional materials to spread the word about ASB and school activities. We also help represent ASB and make sure our school events are being promoted in a fun, creative, and engaging way.",
  image: "/Publicity.jpg",
  },
  { name: "Clubs", lead: "Ani Thomas", members: ["Audrey Winkle"],
  description: "Hey Eagles! We’re your Club Commissioners!  Throughout the year, we help support and promote all of our school clubs. We highlight your clubs on our Instagram, organize Club Rush, and make sure every club has the opportunity to be represented and gain new members. We’re also here to answer any questions you may have about your club and help make sure everything runs smoothly. From time to time, we host Student Senate meetings where we provide information on how to host club events and complete any necessary paperwork. Go clubs!",
  image: "/Clubs.jpg",
  },
  { name: "Athletics", lead: "Maggie Williamson", members: ["Chiara Marini"],
  description: "Athletics committee description",
  image: "/Athletics.jpg",
  },
  { name: "Student/Staff", lead: "Bella Nguyen", members: ["Fiona Makhlouf", "Maia Schobel"],
  description: "The Student/Staff Committee is responsible for creating a positive and welcoming school environment by strengthening relationships between students, teachers, and staff. Our goal is to lead by example while planning appreciation and recognition activities, such as recognizing staff and students of the month, Teacher Appreciation Week, and creating a welcoming environment for our student body. Our committee works to make both students and staff feel valued and supported throughout the school year.",
  image: "/Student and Staff.jpg",
  },
  { name: "Special Projects", lead: "Brooke Immel", members: ["Ella Sabosky", "Tim Roth", "Benni Rayburn"],
  description: "In special projects we do little of everything. One of our main jobs is to coordinate and run special activities, specifically tournaments like powder puff, march madness, and many more. We also help out all the other committees with things like assemblies and pep rallies. You can find us at a majority of ASB events helping out with random tasks.",
  image: "/Special Projects.jpg",
  },
  { name: "Performance", lead: "Noa Waters", members: ["Juliet McPeck"],
  description: "Hi guys, it's Juliet and Noa!  We are the Performance Commissioners this school year. We are in charge of ensuring that everyone in Performing Arts gets the representation they deserve! Some of our duties include decorating lockers, coordinating flash mobs, and raising awareness for upcoming performances! We are so excited for the amazing year ahead!",
  image: "/Performance.jpg",
  },
  { name: "Community Relations", lead: "Annika Fuchs", members: ["Lucy Barondess"],
  description: "The Community Relations Committee works to strengthen connections between our school and the local community. We organize events such as the annual blood drive, toy drive, and Senior Citizen Tea, creating opportunities for students to give back, serve others, and make a positive impact in our community.",
  image: "/Community Relations.jpg",
  },
  { name: "Historian/Homecoming", lead: "Bella Rexon", members: ["Landon Olsen"],
  description: "It’s Bella, Landon, and Ava!! The three of us are on the Homecoming committee. We plan Float Building, pick a theme for Homecoming week, and most importantly plan the Homecoming parade!! Bella and Landon are your ASB Historians for the year. We set an example for the ASB class and make sure everything behind the scenes is in order. From taking pictures, to keeping an updated schedule of events and activities, we do it all!",
  image: "/Historian + Homecoming.jpg",
  },
  { name: "Representative", lead: "", members: ["Tina Akleh", "Kellan Rochon", "Mikey Lambert", "Sophia Galan", "Elliott Bixon", "Olivia Torres", "Brady Stultz", "Makena Burton", "Lochlan Aussem", "Charlie Snyder", "Jack Richmond", "Bodhi Campbell"],
  description: "What’s up eagles!  We are your ASB representatives and we bring the energy, teamwork, and extra hands that help bring our schools biggest ideas to life! From supporting committees and events, to showing up, speaking up, and stepping in wherever needed, representatives are all about school spirit collaboration, and making things happen!!",
  image: "/ASB Reps.jpg",
  },
];
const director = {
  name: "Mrs. Richmond",
  title: "ASB Director",
  image: "/director.jpg",
  bio: "A short bio about the director goes here.",
};
const officersImage = "/officersImage.jpg";
const classImages: Record<string, string> = {
  senior: "/SeniorOfficers.jpg",
  junior: "/JuniorOfficers.jpg",
  sophomore: "/SophomoreOfficers.jpg",
  freshman: "/FreshmenOfficers.jpg",
};
const officersQuote = "Wassup Eagles!  We're your ASB officers this year and we can't wait to make Gundochella the best one yet. We make sure ASB is working and thriving- running meetings, organizing responsibilities, planning Hoco week, and making sure our school's finances are in check. You will see us all around the campus, at different sports and events, and all assemblies/rallies! We've got your back to make this year one of special memories and unforgettable!";
const classQuotes: Record<string, string> = {
  senior: "Hey, it’s Addie, Luke, and Sydney and we’re so excited to be your Senior Officers this year! We can’t wait to make our senior year one to remember with all the special activities we have planned, from Senior Sunrise to Grad Nite at Disneyland and everything in between. We’re pumped to represent the Class of 2027 and make this year unforgettable! Go Eagles!",
  junior: "Hi! We are your 2026-27 junior officers, Chloe Fitzgerald, Ashlyn Ward, and Lily Snyder! This year we will be planning your Homecoming dance, Prom, and running all the assemblies that go along with it. You may have already seen us running the snackbar at your first home football game this season. We aim to promote class participation, school spirit, and offer a welcoming environment for all ESHS students. We are so excited to serve as your junior officers for this school year!",
  sophomore: "What’s up Eagles!  We are your Sophomore class officers. We are so excited for this school year! Kicking the year off strong with the Coachella theme, we strongly encourage participation in this year's spirit week and the Friday night lights. We will be in charge of important events that take place here on campus such as the basketball snack bar, planning next year's prom location, kindness week, and of course float building. We aim to be able to represent the sophomore student body to the best of our ability and have a great year!",
  freshman: "It is your freshman officers. Harper Green is your freshman governor. Lauren Christenson, your lieutenant governor. And last but not least Logan Arnold your Secretary/ Treasurer! This year we are going to plan the freshman HOCO float and overall plan the 9th grade activities that will take place!  We are all so excited for this year and ready to have so much fun!",
};
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
  const officerPositions = positions.filter(position => categoryOf(position) === "officer");
  const classGroups = [
  { key: "senior", label: "Seniors" },
  { key: "junior", label: "Juniors" },
  { key: "sophomore", label: "Sophomores" },
  { key: "freshman", label: "Freshmen" },
];
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
                    <BlurContainer contentVisible={contentVisible} delay="300ms" className="p-4 sm:p-6 mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">ASB Director</h2>
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              {director.image && (
                <img
                  src={director.image}
                  alt={director.name}
                  loading="lazy"
                  className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 rounded-full object-cover border-2 border-white/20"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <p className="text-white font-semibold text-lg break-words">{director.name}</p>
                <p className="text-sm text-gray-300 break-words">{director.title}</p>
                <p className="text-sm text-gray-200 mt-2 break-words">{director.bio}</p>
              </div>
            </div>
          </BlurContainer>
          <BlurContainer contentVisible={contentVisible} delay="400ms" className="p-4 sm:p-6 mb-8">
            <h2 className="text-2xl font-bold text-white text-center mb-4">ASB Officers</h2>
            <img
              src={officersImage}
              alt="ASB Officers"
              loading="lazy"
              className="w-40 h-40 sm:w-48 sm:h-48 mx-auto rounded-full object-cover border-2 border-white/20 mb-6"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.style.display = 'none';
              }}
            />
             <p className="text-center text-gray-300 italic mb-6">"{officersQuote}"</p>
            <div className="space-y-4">
              {officerPositions.map((position, index) => (
                <div key={position._id} className={index > 0 ? "pt-4 border-t border-white/10" : ""}>
                  <h3 className="text-lg font-bold text-white text-center">{position.position}</h3>
                  {position.currentRepresentatives && position.currentRepresentatives.map((rep, repIndex) => (
                    <div key={`${position._id}-${repIndex}`} className="text-center">
                      <p className="text-white break-words">{rep.name}</p>
                      {rep.email && (
                        <p className="text-sm text-gray-300 break-words">{rep.email}</p>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </BlurContainer>

          <div className="space-y-6 mb-8">
            {classGroups.map((group, groupIndex) => (
              <BlurContainer key={group.key} contentVisible={contentVisible} delay={`${500 + groupIndex * 100}ms`} className="p-4 sm:p-6">
                <h3 className="text-2xl font-bold text-white text-center mb-4">{group.label}</h3>
                <img
                  src={classImages[group.key]}
                  alt={group.label}
                  loading="lazy"
                  className="w-40 h-40 sm:w-48 sm:h-48 mx-auto rounded-full object-cover border-2 border-white/20 mb-6"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.style.display = 'none';
                  }}
                />
               <p className="text-center text-gray-300 italic mb-6">"{classQuotes[group.key]}"</p>
                <div className="space-y-4">
                  {positions.filter(position => categoryOf(position) === group.key).map((position, index) => (
                    <div key={position._id} className={index > 0 ? "pt-4 border-t border-white/10" : ""}>
                      <h4 className="text-lg font-bold text-white text-center">{position.position}</h4>
                      {position.currentRepresentatives && position.currentRepresentatives.map((rep, repIndex) => (
                        <div key={`${position._id}-${repIndex}`} className="text-center">
                          <p className="text-white break-words">{rep.name}</p>
                          {rep.email && (
                            <p className="text-sm text-gray-300 break-words">{rep.email}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </BlurContainer>
            ))}
          </div>
<h2 className="text-2xl font-bold text-white mb-6">Committees</h2>
          <BlurContainer contentVisible={contentVisible} delay="600ms" className="p-4 sm:p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {committees.map((committee, index) => (
                <BlurCard
                  key={committee.name}
                  contentVisible={contentVisible}
                  index={index}
                  delay={`${650 + (index * 50)}ms`}
                >
                  <div className="p-4 sm:p-6 flex gap-4">
                    {committee.image && (
                      <img
                        src={committee.image}
                        alt={committee.name}
                        loading="lazy"
                        className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-full object-cover border-2 border-white/20"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white mb-2 break-words">
                      {committee.name}
                    </h3>
                  {committee.description && (
                    <p className="text-sm text-gray-300 mb-3">{committee.description}</p>
                  )}
                  {committee.lead && (
                    <p className="text-sm text-gray-300 mb-3">
                      <span className="font-medium text-gray-200">Lead:</span> {committee.lead}
                    </p>
                  )}
                    <div>
                      <p className="text-sm font-medium text-gray-200 mb-1">Members:</p>
                      <ul className="text-sm text-gray-300 space-y-1">
                        {committee.members.map((member, mIndex) => (
                          <li key={mIndex}>{member}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                </BlurCard>
              ))}
            </div>
          </BlurContainer>
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
