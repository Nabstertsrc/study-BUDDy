import { lazyImport } from './lib/lazyImport';
const Achievements = lazyImport(() => import('./pages/Achievements'));
const Assignments = lazyImport(() => import('./pages/Assignments'));
const Dashboard = lazyImport(() => import('./pages/Dashboard'));
const LearningPath = lazyImport(() => import('./pages/LearningPath'));
const Modules = lazyImport(() => import('./pages/Modules'));
const Settings = lazyImport(() => import('./pages/Settings'));
const StudyLab = lazyImport(() => import('./pages/StudyLab'));
const Welcome = lazyImport(() => import('./pages/Welcome'));
const PrescribedBooks = lazyImport(() => import('./pages/PrescribedBooks'));
const AutoOrganizer = lazyImport(() => import('./pages/AutoOrganizer'));
const MonitoringDashboard = lazyImport(() => import('./pages/MonitoringDashboard'));
const HowItWorks = lazyImport(() => import('./pages/HowItWorks'));
const CommunityHub = lazyImport(() => import('./pages/CommunityHub'));
const Login = lazyImport(() => import('./pages/Login'));
const Signup = lazyImport(() => import('./pages/Signup'));
import __Layout from './Layout.jsx';


export const PAGES = {
    "Achievements": Achievements,
    "Assignments": Assignments,
    "Dashboard": Dashboard,
    "LearningPath": LearningPath,
    "Modules": Modules,
    "Settings": Settings,
    "StudyLab": StudyLab,
    "Welcome": Welcome,
    "PrescribedBooks": PrescribedBooks,
    "AutoOrganizer": AutoOrganizer,
    "Monitoring": MonitoringDashboard,
    "HowItWorks": HowItWorks,
    "CommunityHub": CommunityHub,
    "Login": Login,
    "Signup": Signup,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};