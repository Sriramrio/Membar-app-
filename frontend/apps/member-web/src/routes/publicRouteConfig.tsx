import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
const Landing=lazy(()=>import('@/features/public/pages/PublicLandingPage'));
const Login=lazy(()=>import('@/features/public/pages/LoginPage'));
const Otp=lazy(()=>import('@/features/public/pages/OtpVerificationPage'));
const Forgot=lazy(()=>import('@/features/public/pages/ForgotAccessPage'));
const Visitor=lazy(()=>import('@/features/public/pages/VisitorRegistrationPage'));
const VisitorSuccess=lazy(()=>import('@/features/public/pages/VisitorRegistrationSuccessPage'));
const VisitorVerify=lazy(()=>import('@/features/public/pages/VisitorVerificationPage'));
const MemberRegistration=lazy(()=>import('@/features/public/pages/MemberRegistrationPage'));
const Activation=lazy(()=>import('@/features/public/pages/ActivationPage'));
const Events=lazy(()=>import('@/features/public/pages/PublicEventsPage'));
const EventDetail=lazy(()=>import('@/features/public/pages/PublicEventDetailPage'));
const News=lazy(()=>import('@/features/public/pages/PublicNewsPage'));
const NewsDetail=lazy(()=>import('@/features/public/pages/PublicNewsDetailPage'));
const Privacy=lazy(()=>import('@/features/public/pages/PrivacyPage'));
const Terms=lazy(()=>import('@/features/public/pages/TermsPage'));
const ChapterWorkflow=lazy(()=>import('@/features/management/pages/ChapterWorkflowPage'));
const PlatformLogin=lazy(()=>import('@/features/public/pages/PlatformLoginPage'));
export interface PublicRouteDefinition{path:string;component:LazyExoticComponent<ComponentType>}
export const publicRouteConfig:PublicRouteDefinition[]=[
 {path:'/',component:Landing},{path:'/login',component:Login},{path:'/login/otp',component:Otp},{path:'/forgot-access',component:Forgot},
 {path:'/platformdbnnetwork',component:PlatformLogin},{path:'/platform-admin/login',component:PlatformLogin},
 {path:'/visitor/register',component:Visitor},{path:'/visitor/register/verify',component:VisitorVerify},{path:'/visitor/register/success',component:VisitorSuccess},{path:'/activation',component:Activation},
 {path:'/membership/register',component:MemberRegistration},{path:'/member/register',component:MemberRegistration},
 {path:'/chapter-workflow',component:ChapterWorkflow},{path:'/membership/workflow',component:ChapterWorkflow},
 {path:'/events',component:Events},{path:'/events/:id',component:EventDetail},{path:'/news',component:News},{path:'/news/:id',component:NewsDetail},
 {path:'/privacy',component:Privacy},{path:'/terms',component:Terms}
];
