import "./timeline.css";
import { FaGraduationCap, FaCode, FaBuilding, FaClipboardList, FaChalkboardTeacher } from "react-icons/fa";

const timeLineElements = [
  {
    key: 1,
    date: "Aug 2024 - Jun 2025",
    title: "Teaching Assistant",
    subtitle: "University of Texas at Arlington, Arlington, TX",
    description: "Helping students understand complex topic.",
    icon: <FaChalkboardTeacher />,
  },
  {
    key: 2,
    date: "Jun 2024 - Aug 2024",
    title: "Technical Intern",
    subtitle: "eClinicalworks, Westborough, MA",
    description: "AI powered techical documentation project.",
    icon: <FaCode />,
  },
  {
    key: 3,
    date: "Sep 2023 - Jun 2024",
    title: "Student Assistant - Web Development",
    subtitle: "University of Texas at Arlington, Arlington, TX",
    description: "Sitecore(CMS) to maintain webpages.",
    icon: <FaCode />,
  },
  {
    key: 4,
    date: "Aug 2023 - May 2025",
    title: "Masters of Science in Software Engineering",
    subtitle: "University of Texas at Arlington, Arlington, TX",
    // description: "Major, honors, relevant coursework.",
    icon: <FaGraduationCap />,
  },
  {
    key: 5,
    date: "Jun 2023 - Aug 2023",
    title: "Camp Coordinator",
    subtitle: "University of Texas at Arlington, Arlington, TX",
    description: "Trainig and managing camp counselors.",
    icon: <FaClipboardList />,
  },
  {
    key: 6,
    date: "Aug 2020 - May 2023",
    title: "Resident Assistant",
    subtitle: "University of Texas at Arlington, Arlington, TX",
    description: "Peer leader supporting students.",
    icon: <FaBuilding />,
  },
  {
    key: 7,
    date: "Aug 2019 - May 2023",
    title: "Bachelors of Science in Computer Science",
    subtitle: "University of Texas at Arlington, Arlington, TX",
    // description: "Description.",
    icon: <FaGraduationCap />,
  }
];

export default timeLineElements;