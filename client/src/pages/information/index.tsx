import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Megaphone } from "lucide-react";
import { getAnnouncements, Announcement } from "@/lib/api";
import { UniversalPageLayout } from "@/components/UniversalPageLayout";
import { BlurContainer, BlurCard, BlurActionButton } from "@/components/UniversalBlurComponents";

const StudentGovernmentIcon = () => (
	<svg
		className="h-6 w-6"
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		stroke="currentColor"
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={2}
			d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
		/>
	</svg>
);

const ClubsIcon = () => (
	<svg
		className="h-6 w-6"
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		stroke="currentColor"
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={2}
			d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
		/>
	</svg>
);

const infoSections = [
	{
		id: "student-government",
		title: "Student Government",
		description:
			"Meet your student government representatives and learn about their roles in representing your voice at school.",
		image: "https://images.squarespace-cdn.com/content/v1/57be4dc6f5e231e5516f7e44/1605373317776-D6XRQQFN594G6IUWBECK/StudentCouncil.png",
		path: "/information/elections",
		iconColor: "text-amber-700",
		Icon: StudentGovernmentIcon,
	},
	{
		id: "clubs",
		title: "Clubs",
		description:
			"Join one of our many academic, social, and special interest clubs.",
		image: "https://www.northnationmedia.com/wp-content/uploads/2023/10/school-clubs-1200x849.png",
		path: "/information/clubs",
		iconColor: "text-rose-800",
		Icon: ClubsIcon,
	},
];

export default function Information() {
	const [, setLocation] = useLocation();
	const [announcements, setAnnouncements] = useState<Announcement[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchAnnouncements = async () => {
			try {
				const fetchedAnnouncements = await getAnnouncements();
				setAnnouncements(fetchedAnnouncements);
			} catch (error) {
				console.error('Failed to fetch announcements:', error);
				setAnnouncements([]);
			} finally {
				setLoading(false);
			}
		};

		fetchAnnouncements();
	}, []);

	const handleNavigate = (path: string) => {
		sessionStorage.setItem('info-referrer', '/information');
		setLocation(path);
	};

	return (
		<UniversalPageLayout pageType="information" title="School Information">
			{({ contentVisible }) => (
				<>
					<div>
						<BlurContainer contentVisible={contentVisible} delay="200ms" className="p-4 sm:p-6">
							{loading ? (
								<div className="text-center py-8 text-gray-400">
									<div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
									Loading announcements...
								</div>
							) : announcements.length > 0 ? (
								<div className="space-y-4">
									{announcements.map((announcement) => (
										<div
											key={announcement._id}
											className={`p-4 rounded-lg border ${
												announcement.priority === 'high'
													? 'border-red-400/50 bg-red-500/20'
													: announcement.priority === 'medium'
													? 'border-amber-400/50 bg-amber-500/20'
													: 'border-blue-400/50 bg-blue-500/20'
											}`}
										>
											<div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
												<h3 className="font-semibold text-white break-words">{announcement.title}</h3>
												<span className="text-sm text-gray-300 whitespace-nowrap">{new Date(announcement.date).toLocaleDateString()}</span>
											</div>
											<p className="text-sm mt-2 text-gray-200 break-words">{announcement.content}</p>
											{announcement.priority === 'high' && (
												<div className="mt-2 flex items-center text-red-400 text-sm">
													<svg className="h-4 w-4 mr-1 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
													</svg>
													Important Announcement
												</div>
											)}
										</div>
									))}
								</div>
							) : (
								<div className="text-center py-8 text-gray-400">
									<Megaphone className="h-8 w-8 mx-auto mb-2" aria-hidden="true" />
									No announcements available at this time.
								</div>
							)}
						</BlurContainer>
					</div>

					<div className="h-8"></div>

					<div>
						<h2 className="text-2xl font-bold text-white mb-6">
							Explore School Information
						</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{infoSections.map((section, index) => (
								<BlurCard
									key={section.id}
									contentVisible={contentVisible}
									index={index}
									delay={`${400 + (index * 100)}ms`}
									className="hover:scale-[1.01] cursor-pointer rounded-lg overflow-hidden"
									onClick={() => handleNavigate(section.path)}
								>
									<div className="relative pb-2 p-6">
										<div
											className={`absolute top-4 right-4 ${section.iconColor} bg-white/5 border border-white/10 shadow-2xl rounded-full p-2`}
										>
											<section.Icon />
										</div>
										<h3 className="text-lg font-semibold text-white pr-14 break-words">
											{section.title}
										</h3>
										<p className="text-sm text-gray-300 mt-2">
											{section.description}
										</p>
									</div>
									<div className="pt-0 px-6">
										<div className="h-40 w-full bg-gray-800 rounded-md overflow-hidden">
											<img
												src={section.image}
												alt={section.title}
												loading="lazy"
												className="w-full h-full object-cover opacity-90"
												onError={(e) => {
													e.currentTarget.onerror = null;
													e.currentTarget.style.display = 'none';
												}}
											/>
										</div>
									</div>
									<div className="p-6 pt-4">
										<BlurActionButton
											contentVisible={contentVisible}
											onClick={() => handleNavigate(section.path)}
											className="w-full min-h-11 py-3 px-4 font-semibold justify-center"
										>
											Explore {section.title}
										</BlurActionButton>
									</div>
								</BlurCard>
							))}
						</div>
					</div>
				</>
			)}
		</UniversalPageLayout>
	);
}
