

"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, CheckCircle2, FilePen, Map, Users } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


const citizenFeatures = [
    "AI-Assisted Reporting: Effortless submission with automatic analysis.",
    "Gamification Engine: Earn Utility Points & Badges, climb the Leaderboard.",
    "Interactive Map View: See all reported issues in the community.",
    "Collaborative Reporting: 'Join' existing reports to increase their priority.",
    "Real-Time Tracking: Monitor your tickets from 'Submitted' to 'Resolved'.",
    "Feedback System: Rate completed work to influence supervisor Trust Scores."
];

const workflowSteps = [
    { title: "Citizen Reporting", description: "A citizen finds an issue, takes a photo, provides details (text or audio), and submits it." },
    { title: "AI Analysis", description: "The system's AI automatically checks image relevancy, transcribes audio, determines priority, and generates a title." },
    { title: "Citizen Confirmation", description: "The citizen reviews the AI's analysis and confirms the report." },
    { title: "Triage (Municipal Official)", description: "A new ticket is created, which an official assigns to a field supervisor with a deadline." },
    { title: "Resolution (Supervisor)", description: "The supervisor performs the work and submits a completion report with photos." },
    { title: "Final Approval", description: "The official reviews the supervisor's report, approving or rejecting it." },
];

const municipalFeatures = [
    "Centralized Triage Dashboard: One organized queue for all new reports.",
    "AI-Powered Insights: Instant prioritization for smarter decision-making.",
    "Supervisor Management: Create, manage, and assign tasks efficiently.",
    "Comprehensive Analytics: Visualize issue categories, resolution times, and performance.",
    "Live GIS Map: View all issues color-coded by priority on an interactive map."
];

const supervisorFeatures = [
    "Personalized Work Queue: A clear dashboard of active and resolved tickets.",
    "Performance Analytics: Track Efficiency Points, Trust Score, and history with charts.",
    "AI-Guarded Submissions: Prevents fraudulent reports by detecting AI-generated images.",
    "Streamlined Reporting: Easily submit completion reports with photos from the field.",
    "Leaderboard Ranking: Compete for the top spot based on a rewarding efficiency system."
];

const futureScope = [
    "Predictive Maintenance: Use historical data to predict future issues.",
    "Automated Supervisor Assignment: AI-driven assignment based on location and workload.",
    "Multi-language Support: Expand accessibility to support multiple languages.",
    "Deeper Integrations: Connect with municipal ERP systems and communication channels.",
    "Community Forums: Allow citizens to discuss issues and propose solutions."
];

export default function PresentationPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    React.useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return null;
    }

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
            <header className="text-center space-y-2">
                <Badge variant="secondary">SIH 2024 Presentation</Badge>
                <h1 className="text-5xl font-bold tracking-tight font-headline text-primary">ShohorKotha</h1>
                <p className="text-xl text-muted-foreground">Empowering Communities, One Report at a Time.</p>
            </header>

            <Separator />

            <section>
                <Card>
                    <CardHeader>
                        <CardTitle>The Problem</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-muted-foreground">
                        <p><strong>Disconnected Citizens:</strong> Citizens lack a simple, direct, and effective way to report local infrastructure issues (like potholes, broken lights, or waste).</p>
                        <p><strong>Inefficient Municipalities:</strong> Local governments are overwhelmed with disorganized reports from various channels, making it difficult to prioritize and track tasks.</p>
                        <p><strong>Lack of Transparency:</strong> There's no clear communication channel for citizens to see the status of their reports, leading to frustration and a feeling of being unheard.</p>
                        <p><strong>Delayed Resolutions:</strong> Inefficient workflows lead to significant delays in addressing critical public issues, impacting community well-being and safety.</p>
                    </CardContent>
                </Card>
            </section>

             <section>
                <Card>
                    <CardHeader>
                        <CardTitle>Proposed Solution: ShohorKotha</CardTitle>
                         <CardDescription>An AI-powered, mobile-first Progressive Web App (PWA) that bridges the gap between citizens and their local government.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2 text-muted-foreground">
                            <p><strong>Detailed Explanation:</strong> ShohorKotha is a comprehensive, three-sided platform designed to streamline civic issue reporting and resolution. It empowers citizens to become active community members, equips municipal officials with powerful management tools, and provides field supervisors with a clear, efficient workflow.</p>
                            <p><strong>How it Addresses the Problem:</strong></p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>It solves citizen disconnection by providing an engaging, gamified, and easy-to-use mobile app.</li>
                                <li>It tackles municipal inefficiency by using AI to automatically triage, categorize, and prioritize incoming reports, saving valuable time.</li>
                                <li>It eliminates the lack of transparency by offering real-time status tracking for everyone involved, from the reporting citizen to the resolving supervisor.</li>
                            </ul>
                            <p><strong>Innovation and Uniqueness:</strong></p>
                             <ul className="list-disc list-inside space-y-1">
                                <li><strong>AI-Driven Triage:</strong> Our "Hybrid Priority Engine" uses Google's Gemini AI to analyze images and user notes for keywords, creating an intelligent and automated priority level.</li>
                                <li><strong>Gamification Engine:</strong> We don't just take reports; we build a community. Utility Points, Trust Scores, Efficiency Scores, and unlockable badges encourage high-quality, continuous engagement from both citizens and supervisors.</li>
                                <li><strong>Three-Sided Platform:</strong> Unlike simple reporting tools, ShohorKotha creates a complete, closed-loop ecosystem for citizens, municipal officials, and field supervisors, ensuring accountability and efficiency at every stage.</li>
                             </ul>
                        </div>
                       <p className="text-lg text-center font-medium text-primary bg-primary/10 p-4 rounded-md">
                        Our Mission: To create a transparent, efficient, and collaborative ecosystem for reporting and resolving civic issues, making our communities better, together.
                       </p>
                    </CardContent>
                </Card>
            </section>

            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                    <AccordionTrigger className="text-lg font-semibold text-primary hover:no-underline">View In-Depth Project Breakdown</AccordionTrigger>
                    <AccordionContent>
                        <Card className="mt-4">
                            <CardHeader>
                                <CardTitle>Detailed Idea Description</CardTitle>
                                <CardDescription>A comprehensive breakdown of the CivicPulse platform, its features, and workflows.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <h4 className="font-semibold text-lg mb-2">1. Core Concept: A Three-Sided Ecosystem</h4>
                                    <p className="text-muted-foreground text-sm">CivicPulse is not just a reporting app; it's a complete ecosystem that connects three key groups, each with their own tailored interface and set of tools:</p>
                                    <ul className="list-disc list-inside space-y-2 mt-2 text-sm text-muted-foreground">
                                        <li><strong>Citizens:</strong> The eyes and ears of the community. They report issues, track progress, and provide feedback. Their experience is gamified to encourage participation.</li>
                                        <li><strong>Municipal Officials:</strong> The administrative backbone. They manage incoming reports, assign tasks to supervisors, and monitor overall performance through an analytics dashboard.</li>
                                        <li><strong>Field Supervisors:</strong> The hands-on problem solvers. They receive assigned tasks, perform the necessary work, and report back with photo evidence of completion.</li>
                                    </ul>
                                </div>
                                <Separator />
                                <div>
                                    <h4 className="font-semibold text-lg mb-2">2. The Citizen Workflow: Report, Track, Engage</h4>
                                    <p className="text-muted-foreground text-sm mb-3">The citizen journey is designed to be simple, engaging, and rewarding. Here is the exact, step-by-step process:</p>
                                    <ol className="list-decimal list-inside space-y-3 text-sm">
                                        <li><strong>AI-Assisted Reporting:</strong> A citizen encounters an issue (e.g., a large pothole). They open the ShohorKotha PWA, and in a few taps:
                                            <ul className="list-disc list-inside ml-4 mt-1">
                                                <li>They take one or more photos of the issue. The app can use lightweight on-device ML models for instant validation to check if the image is a real-world photo before uploading.</li>
                                                <li>They can add optional text notes (e.g., "This pothole has been here for weeks and is getting bigger") or record a voice message.</li>
                                                <li>The app automatically captures their GPS coordinates. The user can either use their current location or manually place a pin on a map. This is reverse-geocoded to a human-readable street address.</li>
                                                <li>They select a category from a predefined list (e.g., "Pothole," "Graffiti," "Broken Streetlight").</li>
                                                <li>Upon clicking "Analyze," our system uses a two-pronged approach: the image is analyzed by a **MobileNetV2** ML model to determine a severity score (1-10), while our GenAI model (powered by Google's Gemini) performs analysis of text notes and the image to generate a suggested title (e.g., "Large Pothole on Main Street") and a recommended priority level (Low, Medium, High).</li>
                                            </ul>
                                        </li>
                                        <li><strong>Review & Submit:</strong> The citizen is presented with a clear, easy-to-read "Analysis Preview" screen. This shows the AI's generated title, priority, and the reasoning behind its severity score. If the citizen agrees, they confirm and submit. This action officially creates a new ticket in the system with a unique ID (e.g., #CP-12345) and a status of 'Submitted'.</li>
                                        <li><strong>Gamification & Rewards:</strong> The moment a valid report is submitted, the gamification engine kicks in. The citizen instantly earns "Utility Points" directly proportional to the AI's severity score (e.g., a score of 8 earns them 8 points). They might also unlock badges like "New Reporter" for their first report, or "Sharp Eye" if the severity score is 8 or higher. These points contribute to their rank on the community leaderboard, fostering a sense of competition and achievement.</li>
                                        <li><strong>Real-Time Tracking:</strong> In their "My Tickets" section, the citizen can see all their reported issues. Each ticket displays a visual timeline showing its current status—from 'Submitted' to 'In Progress', 'Pending Approval', and finally 'Resolved'. This provides complete transparency and eliminates the "black box" of traditional reporting methods.</li>
                                        <li><strong>Collaborative Reporting:</strong> Citizens can browse a map of all reported issues. If they see an issue that's already been reported nearby, they can "Join Report." This action increments the report's "join count." This count is a key factor in our Hybrid Priority Engine; for example, a low-priority issue can be automatically elevated to medium after 5 joins, reflecting its importance to the community.</li>
                                        <li><strong>Feedback Loop:</strong> Once a supervisor marks a ticket as resolved and the municipal official approves it, the original reporter and anyone who joined the report are notified. They can then provide a simple star rating (1-10) and an optional comment on the quality of the work. This feedback is not just for show; it directly impacts the supervisor's "Trust Score," creating a powerful accountability mechanism. A high rating increases the score, while a low rating decreases it.</li>
                                    </ol>
                                </div>
                                <Separator />
                                <div>
                                    <h4 className="font-semibold text-lg mb-2">3. The Municipal & Supervisor Workflow: Triage, Assign, Resolve, Verify</h4>
                                    <p className="text-muted-foreground text-sm mb-3">The backend workflow is designed for maximum efficiency, accountability, and fraud prevention.</p>
                                     <ol className="list-decimal list-inside space-y-3 text-sm">
                                        <li><strong>Triage & Assignment (Official):</strong> New tickets appear in the Municipal Official's "Triage Queue." They see a dashboard with all relevant details at a glance: the AI-generated priority, title, category, location, and the number of community members who have joined the report. Based on the issue's category and location, the official assigns the ticket to the most relevant Field Supervisor (e.g., a "Pothole" ticket goes to a "Public Works" supervisor) and sets a deadline for completion.</li>
                                        <li><strong>Work Execution (Supervisor):</strong> The ticket now appears in the Supervisor's "Active Work Queue" on their personalized dashboard. They can view all details, photos, and a map with directions. After completing the work, they must submit a completion report, which requires them to upload one or more photos of the finished job and add written notes about the resolution.</li>
                                        <li><strong>AI-Guarded Verification:</strong> To prevent fraud, our system includes a critical verification step. When a supervisor uploads a completion photo, our AI runs an "AI Image Detection" check. If the image is flagged as AI-generated, the submission is automatically rejected, and the supervisor's "Trust Score" is significantly penalized. This ensures the authenticity of all completion reports.</li>
                                        <li><strong>Final Approval (Official):</strong> The ticket, now in "Pending Approval" status, returns to the Official's dashboard. They are presented with a side-by-side comparison: the original issue photos/notes versus the supervisor's completion photos/notes. Our AI also provides a "Completion Analysis," which includes a cross-validation of the supervisor's 'after' photo against the citizen's 'before' photo to verify the work was done at the correct location and addresses the specific issue shown in the original report. It summarizes the differences and confirms if the resolution matches the original report.
                                            <ul className="list-disc list-inside ml-4 mt-1">
                                                <li>If the work is satisfactory, the official clicks "Approve." The ticket status changes to 'Resolved', and the supervisor earns "Efficiency Points" based on the ticket's severity and timeliness.</li>
                                                <li>If the work is unsatisfactory, they click "Reject," providing a mandatory reason (e.g., "The graffiti is still visible on the wall."). The ticket is sent back to the supervisor's queue with an 'In Progress' status, and their "Trust Score" is slightly reduced to encourage high-quality work.</li>
                                            </ul>
                                        </li>
                                    </ol>
                                </div>
                                <Separator />
                                <div>
                                    <h4 className="font-semibold text-lg mb-2">4. Uniqueness & Innovation: The Engines Driving ShohorKotha</h4>
                                    <p className="text-muted-foreground text-sm mb-3">Our core innovations are what set ShohorKotha apart from simple reporting tools.</p>
                                     <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                                        <li><strong>The Hybrid Priority Engine:</strong> This is our AI-powered brain. It combines multiple data points for an intelligent, automated assessment that goes far beyond simple manual entry:
                                            <ul className="list-disc list-inside ml-4 mt-1">
                                                <li><strong>ML Image Analysis:</strong> A MobileNetV2 model analyzes photos for a severity score (1-10).</li>
                                                <li><strong>GenAI Text Analysis:</strong> The AI scans written notes and audio transcriptions for keywords like "urgent," "dangerous," "blockage," or "fire hazard" that automatically influence the priority level.</li>
                                                <li><strong>Categorical Weighting:</strong> Certain issue categories are inherently given a higher base priority. For instance, a "Safety Hazard" starts with a higher weight than a "Graffiti" report.</li>
                                                <li><strong>Community Weighting:</strong> The number of "joins" from other users acts as a multiplier. Each join signals to the municipality that this issue affects a broader segment of the community, elevating its importance.</li>
                                            </ul>
                                        </li>
                                        <li><strong>The Gamification Engine:</strong> We use carefully designed game mechanics to foster a positive, continuous, and high-quality cycle of engagement from all parties:
                                             <ul className="list-disc list-inside ml-4 mt-1">
                                                <li><strong>For Citizens (Utility Points):</strong> Earned for submitting valid reports, with more points for higher-severity issues. These points can be redeemed for local business vouchers, creating a direct economic incentive for civic participation.</li>
                                                <li><strong>For Supervisors (Efficiency Points):</strong> Earned for timely and approved resolutions. This encourages both the speed and quality of work. Supervisors compete on a leaderboard based on this score.</li>
                                                <li><strong>Trust Score:</strong> A universal reputation metric. Citizens lose points for submitting irrelevant or false reports. Supervisors lose points for rejected work or detected AI-generated photos. This score ensures the integrity and reliability of the entire system.</li>
                                                <li><strong>Badges & Leaderboards:</strong> Provide long-term goals and social recognition for both citizens and supervisors, turning civic duty into a rewarding and competitive experience.</li>
                                            </ul>
                                        </li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
            
            <section>
                <Card>
                     <CardHeader>
                        <CardTitle>How It Works</CardTitle>
                        <CardDescription>A simple, three-step process to make a real impact.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-3 gap-6">
                        <div className="flex flex-col items-center text-center p-4 rounded-lg border">
                             <FilePen className="h-10 w-10 text-primary mb-3" />
                             <h3 className="font-bold text-lg">Report</h3>
                             <p className="text-sm text-muted-foreground">Citizens snap a photo and submit a report. Our AI helps categorize and prioritize it instantly.</p>
                        </div>
                        <div className="flex flex-col items-center text-center p-4 rounded-lg border">
                             <Map className="h-10 w-10 text-primary mb-3" />
                             <h3 className="font-bold text-lg">Manage</h3>
                             <p className="text-sm text-muted-foreground">Officials assign tasks to supervisors from a central dashboard and track all issues on a map.</p>
                        </div>
                        <div className="flex flex-col items-center text-center p-4 rounded-lg border">
                             <CheckCircle2 className="h-10 w-10 text-primary mb-3" />
                             <h3 className="font-bold text-lg">Resolve</h3>
                             <p className="text-sm text-muted-foreground">Supervisors complete the work, submit photo proof, and the citizen is notified of the resolution.</p>
                        </div>
                    </CardContent>
                </Card>
            </section>

             <section className="grid md:grid-cols-1 gap-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Methodology and Implementation Process</CardTitle>
                        <CardDescription>The application follows a clear, step-by-step process from issue reporting to resolution, ensuring transparency and accountability. The workflow is visualized below, and a live working prototype is available for demonstration.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-center p-4 rounded-lg bg-card overflow-x-auto">
                            <pre className="text-sm font-code">
{`graph TD
    subgraph Citizen
        A[Start: Report Issue] --> B{Snap Photo & Add Notes/Audio};
        B --> C[Submit for Analysis];
    end

    subgraph AI Processing
        C --> D{1. Analyze Image Relevancy & Severity};
        D -- Irrelevant --> D_Reject[Reject & Notify User];
        D -- Relevant --> E{2. Transcribe Audio (if any)};
        E --> F{3. Determine Priority};
        F --> G{4. Generate Title};
    end
    
    subgraph Citizen Review
        G --> H{Review AI Analysis};
        H -- Looks Good --> I[Confirm & Submit Report];
        H -- Needs Changes --> B;
    end

    subgraph Municipal Official
        I --> J[Ticket Created in Triage Queue];
        J --> K{Assign to Supervisor & Set Deadline};
    end

    subgraph Field Supervisor
        K --> L[Ticket in 'In Progress' Queue];
        L --> M{Perform Work};
        M --> N[Submit Completion Report];
    end

    subgraph Municipal Official Review
        N --> O{Review Supervisor's Report};
        O -- Approve --> P[Ticket 'Resolved'];
        O -- Reject w/ Reason --> L;
    end

    A --> Z([End]);
    D_Reject --> Z;
    P --> Z;

    style A fill:#22c55e,stroke:#fff,stroke-width:2px,color:#fff
    style Z fill:#ef4444,stroke:#fff,stroke-width:2px,color:#fff
`}
                            </pre>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Technologies to be Used</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <p><strong>Programming Languages:</strong> TypeScript, JavaScript</p>
                        <p><strong>Frameworks:</strong> Next.js, React, Genkit (for AI), Tailwind CSS, ShadCN UI</p>
                        <p><strong>AI & ML Models:</strong></p>
                        <ul className="list-disc list-inside ml-4">
                            <li><strong>AI:</strong> Google's Gemini 2.5 Flash for image analysis, text generation, and audio transcription.</li>
                            <li><strong>ML:</strong> MobileNetV2 for lightweight on-device image validation tasks.</li>
                        </ul>
                        <p><strong>Backend & Database:</strong> Firebase (Authentication, Firestore, Storage)</p>
                        <p><strong>Hosting:</strong> Firebase App Hosting</p>
                         <p><strong>Hardware:</strong> No specialized hardware is required. The application is a PWA accessible via any modern web browser on a smartphone or computer.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Feasibility, Challenges, and Risks</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h4 className="font-semibold mb-2">Analysis of Feasibility</h4>
                            <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm">
                                <li><strong>Technical Feasibility:</strong> High. The proposed tech stack (Next.js, Firebase, Genkit) is mature and well-suited for building scalable web applications. Google's Gemini models provide powerful, accessible AI capabilities for the required tasks.</li>
                                <li><strong>Operational Feasibility:</strong> Moderate. Success depends on adoption by municipal bodies. The platform is designed to be intuitive, reducing the training required for officials and supervisors, thus increasing the likelihood of adoption.</li>
                                <li><strong>Economic Feasibility:</strong> High. The initial development cost is manageable within a hackathon scope. For a real-world product, a subscription-based model for municipalities is a proven SaaS strategy. The cloud-based infrastructure (Firebase) scales with demand, minimizing upfront investment.</li>
                            </ul>
                        </div>
                        <Separator/>
                        <div>
                            <h4 className="font-semibold mb-2">Potential Challenges and Risks</h4>
                            <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm">
                                <li><strong>User Adoption:</strong> Both citizens and municipal bodies need to be convinced to adopt a new platform.</li>
                                <li><strong>Data Quality & Misuse:</strong> Low-quality reports or fraudulent submissions can clog the system.</li>
                                <li><strong>Data Privacy & Security:</strong> Handling user data and location information requires robust security measures.</li>
                            </ul>
                        </div>
                        <Separator/>
                        <div>
                            <h4 className="font-semibold mb-2">Strategies for Overcoming Challenges</h4>
                            <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm">
                                <li><strong>Adoption Strategy:</strong> Launch pilot programs with a few tech-forward municipalities. Use community outreach and the gamification engine to drive citizen engagement.</li>
                                <li><strong>Quality Control:</strong> The AI's relevancy check acts as a first-line defense. The Trust Score system disincentivizes spam by penalizing users for irrelevant reports and supervisors for fake completion photos.</li>
                                <li><strong>Security Measures:</strong> Leverage Firebase's built-in security rules for database access control and ensure all data transmission is encrypted. User PII (Personally Identifiable Information) will be handled with care, and location data is only used for issue reporting.</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Potential Impact & Benefits</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h4 className="font-semibold mb-2 text-primary">Social Benefits</h4>
                            <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm">
                                <li>Increases civic engagement and strengthens community pride.</li>
                                <li>Builds trust and transparency between citizens and local government.</li>
                                <li>Improves public safety and quality of life by resolving issues faster.</li>
                            </ul>
                        </div>
                        <Separator/>
                        <div>
                            <h4 className="font-semibold mb-2 text-primary">Economic Benefits</h4>
                            <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm">
                                <li>Reduces operational costs for municipalities through efficient, AI-driven workflows.</li>
                                <li>Helps prevent costly damage to public infrastructure with proactive reporting.</li>
                                <li>Supports local businesses by fostering a cleaner, safer, and more attractive environment.</li>
                            </ul>
                        </div>
                        <Separator/>
                        <div>
                            <h4 className="font-semibold mb-2 text-primary">Environmental Benefits</h4>
                            <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm">
                                <li>Promotes a cleaner environment by streamlining waste management and pollution reporting.</li>
                                <li>Helps maintain green spaces through efficient tracking of tree and park maintenance needs.</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Competitive Analysis</CardTitle>
                        <CardDescription>How ShohorKotha compares to existing solutions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="font-bold">Feature</TableHead>
                                    <TableHead className="text-center font-bold">Traditional Methods (Phone/Email)</TableHead>
                                    <TableHead className="text-center font-bold">Basic Trackers</TableHead>
                                    <TableHead className="text-center font-bold text-primary">CivicPulse</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell>AI-Powered Triage</TableCell>
                                    <TableCell className="text-center text-destructive">❌</TableCell>
                                    <TableCell className="text-center text-destructive">❌</TableCell>
                                    <TableCell className="text-center text-green-500">✅</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Gamification Engine</TableCell>
                                    <TableCell className="text-center text-destructive">❌</TableCell>
                                    <TableCell className="text-center text-destructive">❌</TableCell>
                                    <TableCell className="text-center text-green-500">✅</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>3-Sided Platform (Citizen, Official, Supervisor)</TableCell>
                                    <TableCell className="text-center text-destructive">❌</TableCell>
                                    <TableCell className="text-center">Partial</TableCell>
                                    <TableCell className="text-center text-green-500">✅</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Real-time Status Tracking</TableCell>
                                    <TableCell className="text-center text-destructive">❌</TableCell>
                                    <TableCell className="text-center text-green-500">✅</TableCell>
                                    <TableCell className="text-center text-green-500">✅</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Centralized Dashboard</TableCell>
                                    <TableCell className="text-center text-destructive">❌</TableCell>
                                    <TableCell className="text-center">Partial</TableCell>
                                    <TableCell className="text-center text-green-500">✅</TableCell>
                                </TableRow>
                                 <TableRow>
                                    <TableCell>Analytics & Reporting</TableCell>
                                    <TableCell className="text-center text-destructive">❌</TableCell>
                                    <TableCell className="text-center text-destructive">❌</TableCell>
                                    <TableCell className="text-center text-green-500">✅</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>References & Research Work</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <p>Our solution is built upon established principles of civic technology and user engagement. Key concepts include:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li><a href="#" className="text-primary hover:underline">"The Impact of Gamification on Civic Engagement" - Journal of Urban Technology</a></li>
                            <li><a href="#" className="text-primary hover:underline">"AI in the Public Sector: A Framework for Ethical Implementation" - GovTech Review</a></li>
                            <li><a href="#" className="text-primary hover:underline">Firebase and Google Cloud documentation for scalable, secure application development.</a></li>
                        </ul>
                    </CardContent>
                </Card>

             </section>

            <section className="grid md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Users className="text-primary"/> For Citizens</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {citizenFeatures.map((feature, index) => <p key={index} className="text-sm text-muted-foreground flex"><ArrowRight className="h-4 w-4 mr-2 mt-0.5 shrink-0 text-primary"/>{feature}</p>)}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Users className="text-primary"/> For Officials</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {municipalFeatures.map((feature, index) => <p key={index} className="text-sm text-muted-foreground flex"><ArrowRight className="h-4 w-4 mr-2 mt-0.5 shrink-0 text-primary"/>{feature}</p>)}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Users className="text-primary"/> For Supervisors</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {supervisorFeatures.map((feature, index) => <p key={index} className="text-sm text-muted-foreground flex"><ArrowRight className="h-4 w-4 mr-2 mt-0.5 shrink-0 text-primary"/>{feature}</p>)}
                    </CardContent>
                </Card>
            </section>

             <section className="grid md:grid-cols-1 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Future Scope & Vision</CardTitle>
                    </CardHeader>
                     <CardContent className="space-y-2">
                        {futureScope.map((feature, index) => <p key={index} className="text-sm text-muted-foreground flex"><ArrowRight className="h-4 w-4 mr-2 mt-0.5 shrink-0 text-primary"/>{feature}</p>)}
                    </CardContent>
                </Card>
             </section>

             <footer className="text-center py-6">
                <h2 className="text-2xl font-bold font-headline text-primary">Thank You!</h2>
                <p className="text-muted-foreground">Any Questions?</p>
             </footer>
        </div>
    );
}

    