import Achievements from './pages/Achievements';
import Assignments from './pages/Assignments';
import Dashboard from './pages/Dashboard';
import LearningPath from './pages/LearningPath';
import Modules from './pages/Modules';
import Payment from './pages/Payment';
import Settings from './pages/Settings';
import StudyLab from './pages/StudyLab';
import Welcome from './pages/Welcome';
import PrescribedBooks from './pages/PrescribedBooks';
import AutoOrganizer from './pages/AutoOrganizer';
import MonitoringDashboard from './pages/MonitoringDashboard';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Achievements": Achievements,
    "Assignments": Assignments,
    "Dashboard": Dashboard,
    "LearningPath": LearningPath,
    "Modules": Modules,
    "Payment": Payment,
    "Settings": Settings,
    "StudyLab": StudyLab,
    "Welcome": Welcome,
    "PrescribedBooks": PrescribedBooks,
    "AutoOrganizer": AutoOrganizer,
    "Monitoring": MonitoringDashboard,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};