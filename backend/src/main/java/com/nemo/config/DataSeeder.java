package com.nemo.config;

import com.nemo.client.Client;
import com.nemo.client.ClientRepository;
import com.nemo.company.Company;
import com.nemo.company.CompanyRepository;
import com.nemo.asset.Asset;
import com.nemo.asset.AssetRepository;
import com.nemo.documentation.WikiPage;
import com.nemo.documentation.WikiPageRepository;
import com.nemo.task.Task;
import com.nemo.task.TaskRepository;
import com.nemo.location.Location;
import com.nemo.location.LocationRepository;
import com.nemo.phase.Deliverable;
import com.nemo.phase.Deliverable.DeliverableState;
import com.nemo.phase.DeliverableRepository;
import com.nemo.phase.Phase;
import com.nemo.phase.PhaseRepository;
import com.nemo.pmo.RaidItem;
import com.nemo.pmo.RaidItemRepository;
import com.nemo.project.BoardColumn;
import com.nemo.project.BoardColumnRepository;
import com.nemo.project.Label;
import com.nemo.project.LabelRepository;
import com.nemo.project.Project;
import com.nemo.project.ProjectFavorite;
import com.nemo.project.ProjectFavoriteRepository;
import com.nemo.project.ProjectMember;
import com.nemo.project.ProjectMemberRepository;
import com.nemo.project.ProjectRepository;
import com.nemo.program.Program;
import com.nemo.program.ProgramRepository;
import com.nemo.sprint.Sprint;
import com.nemo.sprint.Sprint.SprintStatus;
import com.nemo.sprint.SprintRepository;
import com.nemo.timetracking.TimeLog;
import com.nemo.timetracking.TimeLogRepository;
import com.nemo.timetracking.UserRate;
import com.nemo.timetracking.UserRateRepository;
import com.nemo.user.User;
import com.nemo.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
@Order(1)
public class DataSeeder implements CommandLineRunner {

    @Value("${nemo.mode:prod}")
    private String mode;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CompanyRepository companyRepository;
    private final OrganizationConfigRepository organizationConfigRepository;
    private final ProgramRepository programRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final TaskRepository taskRepository;
    private final TaskStatusRepository taskStatusRepository;
    private final TaskTypeRepository taskTypeRepository;
    private final BoardColumnRepository boardColumnRepository;
    private final SprintRepository sprintRepository;
    private final LabelRepository labelRepository;
    private final RaidItemRepository raidItemRepository;
    private final TimeLogRepository timeLogRepository;
    private final UserRateRepository userRateRepository;
    private final ProjectFavoriteRepository projectFavoriteRepository;
    private final PublicHolidayRepository publicHolidayRepository;
    private final PhaseRepository phaseRepository;
    private final DeliverableRepository deliverableRepository;
    private final WikiPageRepository wikiPageRepository;
    private final LocationRepository locationRepository;
    private final AssetRepository assetRepository;
    private final ClientRepository clientRepository;

    public DataSeeder(UserRepository userRepository,
                      PasswordEncoder passwordEncoder,
                      CompanyRepository companyRepository,
                      OrganizationConfigRepository organizationConfigRepository,
                      ProgramRepository programRepository,
                      ProjectRepository projectRepository,
                      ProjectMemberRepository projectMemberRepository,
                      TaskRepository taskRepository,
                      TaskStatusRepository taskStatusRepository,
                      TaskTypeRepository taskTypeRepository,
                      BoardColumnRepository boardColumnRepository,
                      SprintRepository sprintRepository,
                      LabelRepository labelRepository,
                      RaidItemRepository raidItemRepository,
                      TimeLogRepository timeLogRepository,
                      UserRateRepository userRateRepository,
                      ProjectFavoriteRepository projectFavoriteRepository,
                      PublicHolidayRepository publicHolidayRepository,
                      PhaseRepository phaseRepository,
                      DeliverableRepository deliverableRepository,
                      WikiPageRepository wikiPageRepository,
                      LocationRepository locationRepository,
                      AssetRepository assetRepository,
                      ClientRepository clientRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.companyRepository = companyRepository;
        this.organizationConfigRepository = organizationConfigRepository;
        this.programRepository = programRepository;
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.taskRepository = taskRepository;
        this.taskStatusRepository = taskStatusRepository;
        this.taskTypeRepository = taskTypeRepository;
        this.boardColumnRepository = boardColumnRepository;
        this.sprintRepository = sprintRepository;
        this.labelRepository = labelRepository;
        this.raidItemRepository = raidItemRepository;
        this.timeLogRepository = timeLogRepository;
        this.userRateRepository = userRateRepository;
        this.projectFavoriteRepository = projectFavoriteRepository;
        this.publicHolidayRepository = publicHolidayRepository;
        this.phaseRepository = phaseRepository;
        this.deliverableRepository = deliverableRepository;
        this.wikiPageRepository = wikiPageRepository;
        this.locationRepository = locationRepository;
        this.assetRepository = assetRepository;
        this.clientRepository = clientRepository;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 1) return;
        if ("prod".equals(mode)) return;

        LocalDate today = LocalDate.now();

        // Companies
        String gName = "dev".equals(mode) ? "SIGroup" : "Netopia Group";
        String c1Name = "dev".equals(mode) ? "Sione" : "Netopia";
        String c1Key = "dev".equals(mode) ? "SIO" : "NTO";
        String c1Site = "dev".equals(mode) ? "http://www.sione.ma" : "http://www.netopia.ma";
        String c1Addr = "dev".equals(mode) ? "45 Avenue Mohammed V, Casablanca" : "Imb hightech, av Ennakhil, Hay Riad, Rabat";
        String c1Logo = "https://mederp.net/downloads/nemo/" + c1Name.toLowerCase() + ".jpg";
        String c2Name = "dev".equals(mode) ? "Partion" : "Harmony";
        String c2Key = "dev".equals(mode) ? "PAR" : "HRM";
        String c2Addr = "dev".equals(mode) ? "78 Boulevard Zerktouni, Casablanca" : "14 Rue Annasim, Hay Riad, Rabat";
        String c2Site = "dev".equals(mode) ? "http://www.partion.ma" : "http://www.harmony.ma";
        String c2Logo = "https://mederp.net/downloads/nemo/" + c2Name.toLowerCase() + ".jpg";
        String c3Name = "dev".equals(mode) ? "Sportfull" : "MyTeam";
        String c3Key = "dev".equals(mode) ? "SPO" : "MTM";
        String c3Addr = "dev".equals(mode) ? "12 Rue Ibn Sina, Marrakech" : "Imb 5, Bouskoura, Casablanca";
        String c3Site = "dev".equals(mode) ? "http://www.sportfull.ma" : "http://www.myteam.ma";
        String c3Logo = "https://mederp.net/downloads/nemo/" + c3Name.toLowerCase() + ".jpg";
        String c4Name = "dev".equals(mode) ? "Medocode" : "medERP";
        String c4Key = "dev".equals(mode) ? "MDC" : "MER";
        String c4Addr = "dev".equals(mode) ? "33 Avenue Hassan II, Tanger" : "601, technopark, Rabat";
        String c4Site = "dev".equals(mode) ? "http://www.medocode.ma" : "http://www.mederp.ma";
        String c4Logo = "https://mederp.net/downloads/nemo/" + c4Name.toLowerCase() + ".jpg";

        Company company1 = createCompany(c1Name, c1Key, "Digital innovation and technology solutions",
                c1Addr, c1Site, c1Logo, 1);
        Company company2 = createCompany(c2Name, c2Key, "Consulting and organizational development",
                c2Addr, c2Site, c2Logo, 2);
        Company company3 = createCompany(c3Name, c3Key, "Team collaboration and productivity tools",
                c3Addr, c3Site, c3Logo, 3);
        Company company4 = createCompany(c4Name, c4Key, "Healthcare ERP solutions and medical information systems",
                c4Addr, c4Site, c4Logo, 4);

        // Organization config (global only — companies use their own address/website/logo fields)
        createOrgConfig(gName, null,
                c1Addr, c1Site, "https://mederp.net/downloads/nemo/" + gName.split(" ")[0].toLowerCase() + ".jpg");

        // Users
        String c1Domain = "dev".equals(mode) ? "sione.ma" : "netopia.ma";
        String c2Domain = "dev".equals(mode) ? "partion.ma" : "harmony.ma";
        String c3Domain = "dev".equals(mode) ? "sportfull.ma" : "myteam.ma";
        String c4Domain = "dev".equals(mode) ? "medocode.ma" : "mederp.net";

        User admin = createUser("admin", "admin@" + c1Domain, "Admin", "User", User.Role.ADMIN, null,
                "System Administrator", "IT", "+212 600 000 001", LocalDate.of(2023, 1, 15));
        User majid = createUser("majid", "majid@" + c1Domain, "Majid", "Hassan", User.Role.MANAGER, company1,
                "Project Manager", "Engineering", "+212 600 000 002", LocalDate.of(2023, 3, 1));
        User dev1 = createUser("ismail", "ismail@" + c1Domain, "Ismail", "Baraka", User.Role.CONTRIBUTOR, company1,
                "Senior Developer", "Engineering", "+212 600 000 003", LocalDate.of(2023, 5, 15));
        User dev2 = createUser("hanane", "hanane@" + c1Domain, "Hanane", "Machkour", User.Role.CONTRIBUTOR, company1,
                "Frontend Developer", "Engineering", "+212 600 000 004", LocalDate.of(2024, 1, 10));
        User dev3 = createUser("wadii", "wadii@" + c2Domain, "Wadii", "Mokhtari", User.Role.CONTRIBUTOR, company2,
                "Backend Developer", "Engineering", "+212 600 000 005", LocalDate.of(2024, 2, 1));
        User dev4 = createUser("ahmed", "ahmed@" + c2Domain, "Ahmed", "Azouzi", User.Role.CONTRIBUTOR, company2,
                "Full-Stack Developer", "Engineering", "+212 600 000 006", LocalDate.of(2024, 3, 15));
        User pmHarmony = createUser("karima", "karima@" + c2Domain, "Karima", "Chari", User.Role.MANAGER, company2,
                "Delivery Manager", "Operations", "+212 600 000 007", LocalDate.of(2023, 6, 1));
        User salim = createUser("salim", "salim@" + c1Domain, "Salim", "Rachidi", User.Role.EXECUTIVE, null,
                "CEO", "Executive", "+212 600 000 008", LocalDate.of(2022, 1, 1));
        User basma = createUser("basma", "basma@" + c1Domain, "Basma", "Tayeb", User.Role.EXTERNAL, null,
                "Consultant", null, null, LocalDate.of(2025, 1, 10));
        User younes = createUser("younes", "younes@" + c4Domain, "Younes", "Alami", User.Role.CONTRIBUTOR, company4,
                "DevOps Engineer", "Infrastructure", "+212 600 000 010", LocalDate.of(2024, 7, 1));
        User youssef = createUser("youssef", "youssef@" + c3Domain, "Youssef", "Bennani", User.Role.MANAGER, company3,
                "Team Lead", "Engineering", "+212 600 000 011", LocalDate.of(2023, 9, 1));
        User walid = createUser("walid", "walid@" + c3Domain, "Walid", "El Idrissi", User.Role.CONTRIBUTOR, company3,
                "QA Engineer", "Quality", "+212 600 000 012", LocalDate.of(2024, 4, 15));
        User mehdi = createUser("mehdi", "mehdi@" + c1Domain, "Mehdi", "El Amrani", User.Role.HR, null,
                "HR Director", "Human Resources", "+212 600 000 013", LocalDate.of(2022, 6, 1));

        // User rates for EVM
        createUserRate(admin, new BigDecimal("75.00"), LocalDate.of(2025, 1, 1));
        createUserRate(majid, new BigDecimal("90.00"), LocalDate.of(2025, 1, 1));
        createUserRate(dev1, new BigDecimal("65.00"), LocalDate.of(2025, 1, 1));
        createUserRate(dev2, new BigDecimal("70.00"), LocalDate.of(2025, 1, 1));
        createUserRate(dev3, new BigDecimal("60.00"), LocalDate.of(2025, 1, 1));
        createUserRate(dev4, new BigDecimal("55.00"), LocalDate.of(2025, 1, 1));
        createUserRate(pmHarmony, new BigDecimal("85.00"), LocalDate.of(2025, 1, 1));
        createUserRate(younes, new BigDecimal("70.00"), LocalDate.of(2025, 1, 1));
        createUserRate(youssef, new BigDecimal("80.00"), LocalDate.of(2025, 1, 1));
        createUserRate(walid, new BigDecimal("60.00"), LocalDate.of(2025, 1, 1));
        createUserRate(mehdi, new BigDecimal("80.00"), LocalDate.of(2025, 1, 1));

        // Programs
        Program ehealth = createProgram("eHealth", "EH", "Digital health transformation initiative", majid, company1);
        Program mobilePlatform = createProgram("Mobile Platform", "MOB", "Mobile app platform development", pmHarmony, company2);
        Program globalInit = createProgram("Global Initiative", "GI", "Cross-company strategic initiative", salim, null);
        Program erpProgram = createProgram("medERP", "MER", "Healthcare ERP and medical information systems", salim, company4);

        // Clients
        Client cnss = createClient("CNSS", "Government", company1);
        Client frmf = createClient("FRMF", "Sports", null);
        Client iam = createClient("IAM", "Telecommunications", company2);
        Client msps = createClient("MSPS", "Government", company1);
        Client minds = createClient("M INDS", "Industrial", company2);

        // Projects with PMO fields
        Project fse = createProject("FSE", "FSE", "Full Stack Engineering platform",
                ehealth, majid, Project.Stage.EXECUTION, 8,
                new BigDecimal("150000"), new BigDecimal("150000"), new BigDecimal("12000"),
                LocalDate.of(2025, 1, 15), LocalDate.of(2025, 9, 30), company1);
        fse.setClient(cnss); fse = projectRepository.save(fse);

        Project apiGateway = createProject("API Gateway", "AG", "Central API gateway and service mesh",
                ehealth, majid, Project.Stage.PLANNING, 6,
                new BigDecimal("80000"), new BigDecimal("80000"), new BigDecimal("3500"),
                LocalDate.of(2025, 3, 1), LocalDate.of(2026, 12, 15), company1);

        Project mobileApp = createProject("Mobile App", "MA", "Cross-platform mobile application",
                mobilePlatform, pmHarmony, Project.Stage.EXECUTION, 7,
                new BigDecimal("200000"), new BigDecimal("200000"), new BigDecimal("45000"),
                LocalDate.of(2025, 2, 1), LocalDate.of(2025, 10, 31), company2);
        mobileApp.setClient(minds); mobileApp = projectRepository.save(mobileApp);

        Project infraUpgrade = createProject("Infrastructure Upgrade", "IU", "Cloud infrastructure modernization",
                globalInit, salim, Project.Stage.INITIATION, 5,
                new BigDecimal("50000"), new BigDecimal("50000"), BigDecimal.ZERO,
                LocalDate.of(2025, 6, 1), LocalDate.of(2025, 11, 30), null);

        // Additional project per program
        Project eHealthPortal = createProject("Patient Portal", "PP", "Patient-facing health information portal",
                ehealth, majid, Project.Stage.INITIATION, 6,
                new BigDecimal("95000"), new BigDecimal("95000"), BigDecimal.ZERO,
                LocalDate.of(2025, 7, 1), LocalDate.of(2027, 3, 31), company1);
        eHealthPortal.setClient(msps); eHealthPortal = projectRepository.save(eHealthPortal);

        Project mobilePay = createProject("Mobile Payments", "MP", "In-app payment and billing integration",
                mobilePlatform, pmHarmony, Project.Stage.PLANNING, 7,
                new BigDecimal("120000"), new BigDecimal("120000"), new BigDecimal("5000"),
                LocalDate.of(2025, 5, 1), LocalDate.of(2026, 12, 31), company2);
        mobilePay.setClient(iam); mobilePay = projectRepository.save(mobilePay);

        Project dataWarehouse = createProject("Data Warehouse", "DW", "Enterprise data warehouse and analytics platform",
                globalInit, salim, Project.Stage.PLANNING, 8,
                new BigDecimal("180000"), new BigDecimal("180000"), new BigDecimal("10000"),
                LocalDate.of(2025, 8, 1), LocalDate.of(2026, 6, 30), null);

        Project erpProject = createProject("medERP", "MER", "Healthcare ERP platform for hospital and clinic management",
                erpProgram, younes, Project.Stage.EXECUTION, 7,
                new BigDecimal("250000"), new BigDecimal("250000"), new BigDecimal("30000"),
                LocalDate.of(2025, 1, 1), LocalDate.of(2025, 12, 31), company4);

        Project footballTeam = createProject("Football Team Manager", "FTM", "Football team management and player tracking platform",
                null, youssef, Project.Stage.EXECUTION, 7,
                new BigDecimal("120000"), new BigDecimal("120000"), new BigDecimal("18000"),
                LocalDate.of(2025, 3, 1), LocalDate.of(2025, 11, 30), company3);
        footballTeam.setClient(frmf); footballTeam = projectRepository.save(footballTeam);

        // Add members
        addMember(fse, majid);
        addMember(fse, dev1);
        addMember(fse, dev2);
        addMember(apiGateway, dev1);
        addMember(apiGateway, majid);
        addMember(mobileApp, dev3);
        addMember(mobileApp, dev4);
        addMember(mobileApp, pmHarmony);
        addMember(infraUpgrade, dev1);
        addMember(infraUpgrade, dev3);
        addMember(infraUpgrade, salim);
        addMember(eHealthPortal, dev2);
        addMember(eHealthPortal, majid);
        addMember(mobilePay, dev3);
        addMember(mobilePay, dev4);
        addMember(mobilePay, pmHarmony);
        addMember(dataWarehouse, dev1);
        addMember(dataWarehouse, salim);
        addMember(erpProject, younes);
        addMember(footballTeam, youssef);
        addMember(footballTeam, walid);
        addMember(footballTeam, dev1);

        // External user assigned to FSE
        basma.setAssignedProject(fse);
        userRepository.save(basma);
        addMember(fse, basma);

        // Favorites (per-user) — each user favorites 1-2 projects from their company (or any if global)
        addFavorite(admin, fse);
        addFavorite(admin, mobileApp);
        addFavorite(majid, fse);
        addFavorite(majid, apiGateway);
        addFavorite(dev1, fse);
        addFavorite(dev2, fse);
        addFavorite(dev3, mobileApp);
        addFavorite(dev4, mobileApp);
        addFavorite(pmHarmony, mobileApp);
        addFavorite(pmHarmony, mobilePay);
        addFavorite(salim, fse);
        addFavorite(salim, dataWarehouse);
        addFavorite(younes, erpProject);
        addFavorite(youssef, footballTeam);
        addFavorite(walid, footballTeam);
        addFavorite(mehdi, fse);
        addFavorite(mehdi, erpProject);

        // Phases with deliverables
        Phase fseInit = createPhase("Initiation", "Project kickoff and requirements gathering", fse, 0,
                LocalDate.of(2025, 1, 15), LocalDate.of(2025, 2, 15));
        createDeliverable("Project Charter", "Defines scope, objectives, and stakeholders", fseInit, DeliverableState.VALIDATED, LocalDate.of(2025, 2, 1));
        createDeliverable("Requirements Document", "Functional and non-functional requirements", fseInit, DeliverableState.VALIDATED, LocalDate.of(2025, 2, 15));

        Phase fseExec = createPhase("Execution", "Core development and implementation", fse, 1,
                LocalDate.of(2025, 2, 16), LocalDate.of(2025, 8, 31));
        createDeliverable("MVP Release", "Minimum viable product with core features", fseExec, DeliverableState.DELIVERED, LocalDate.of(2025, 5, 1));
        createDeliverable("API Layer", "RESTful API endpoints for all modules", fseExec, DeliverableState.DELIVERED, LocalDate.of(2025, 6, 15));
        createDeliverable("Integration Tests", "End-to-end test suite for all services", fseExec, DeliverableState.DRAFT, LocalDate.of(2025, 8, 31));

        Phase fseClose = createPhase("Closing", "Project wrap-up and handover", fse, 2,
                LocalDate.of(2025, 9, 1), LocalDate.of(2025, 9, 30));
        createDeliverable("Final Documentation", "Complete project documentation package", fseClose, DeliverableState.DRAFT, LocalDate.of(2025, 9, 15));
        createDeliverable("Handover Report", "Lessons learned and operational guide", fseClose, DeliverableState.DRAFT, LocalDate.of(2025, 9, 30));

        Phase mobilePlan = createPhase("Planning", "Design and architecture phase", mobileApp, 0,
                LocalDate.of(2025, 2, 1), LocalDate.of(2025, 3, 15));
        createDeliverable("UX Wireframes", "Mobile app screen designs and user flows", mobilePlan, DeliverableState.VALIDATED, LocalDate.of(2025, 3, 1));
        createDeliverable("Architecture Document", "Technical architecture and API contracts", mobilePlan, DeliverableState.VALIDATED, LocalDate.of(2025, 3, 15));

        Phase mobileExec = createPhase("Execution", "Mobile app development", mobileApp, 1,
                LocalDate.of(2025, 3, 16), LocalDate.of(2025, 10, 15));
        createDeliverable("Alpha Build", "Core functionality with placeholder data", mobileExec, DeliverableState.DELIVERED, LocalDate.of(2025, 6, 1));
        createDeliverable("Beta Build", "Feature-complete build for testing", mobileExec, DeliverableState.DRAFT, LocalDate.of(2025, 9, 1));
        createDeliverable("App Store Submission", "Final build with App Store assets", mobileExec, DeliverableState.DRAFT, LocalDate.of(2025, 10, 15));

        Phase apiPlan = createPhase("Planning", "API gateway design", apiGateway, 0,
                LocalDate.of(2025, 3, 1), LocalDate.of(2025, 5, 31));
        createDeliverable("API Specification", "OpenAPI spec for gateway endpoints", apiPlan, DeliverableState.VALIDATED, LocalDate.of(2025, 4, 15));
        createDeliverable("Security Audit Plan", "Security review checklist and tooling setup", apiPlan, DeliverableState.DRAFT, LocalDate.of(2025, 5, 31));

        Phase apiExec = createPhase("Execution", "Gateway implementation", apiGateway, 1,
                LocalDate.of(2025, 6, 1), LocalDate.of(2025, 12, 15));
        createDeliverable("Rate Limiter Module", "Configurable rate limiting per service", apiExec, DeliverableState.DRAFT, LocalDate.of(2025, 9, 1));
        createDeliverable("Service Registry", "Dynamic service discovery and health checks", apiExec, DeliverableState.DRAFT, LocalDate.of(2025, 12, 15));

        Phase erpInit = createPhase("Initiation", "Stakeholder alignment and scope", erpProject, 0,
                LocalDate.of(2025, 1, 1), LocalDate.of(2025, 2, 28));
        createDeliverable("Business Case", "ROI analysis and project justification", erpInit, DeliverableState.VALIDATED, LocalDate.of(2025, 1, 31));
        createDeliverable("Stakeholder Map", "Key stakeholders and communication plan", erpInit, DeliverableState.VALIDATED, LocalDate.of(2025, 2, 15));

        Phase erpExec = createPhase("Execution", "ERP module development", erpProject, 1,
                LocalDate.of(2025, 3, 1), LocalDate.of(2025, 11, 30));
        createDeliverable("Patient Management Module", "Core patient record system", erpExec, DeliverableState.DELIVERED, LocalDate.of(2025, 6, 30));
        createDeliverable("Billing Module", "Insurance and payment processing", erpExec, DeliverableState.DRAFT, LocalDate.of(2025, 11, 30));

        Phase ftmExec = createPhase("Execution", "Core platform features", footballTeam, 0,
                LocalDate.of(2025, 3, 1), LocalDate.of(2025, 9, 30));
        createDeliverable("Player Database", "Player profiles, stats, and history", ftmExec, DeliverableState.DELIVERED, LocalDate.of(2025, 5, 15));
        createDeliverable("Match Engine", "Match scheduling and result tracking", ftmExec, DeliverableState.DRAFT, LocalDate.of(2025, 9, 30));

        // Wiki pages with mermaid diagrams
        createWikiPage("Project Overview", "overview", fse, admin,
                "# FSE Project Overview\n\n## Objectives\n\nThe Full Stack Engineering platform aims to deliver a modern, scalable web application for enterprise customers.\n\n### Key Goals\n\n- **Performance**: Sub-200ms response times\n- **Security**: SOC2 compliance\n- **Scalability**: 10x traffic growth support\n\n## Architecture\n\n```mermaid\ngraph TD\n    Client[Web Client] --> LB[Load Balancer]\n    LB --> GW[API Gateway]\n    GW --> Auth[Auth Service]\n    GW --> Core[Core API]\n    GW --> Notify[Notification Service]\n    Core --> DB[(PostgreSQL)]\n    Core --> Cache[(Redis Cache)]\n    Notify --> Queue[RabbitMQ]\n```\n\n## Timeline\n\n```mermaid\ngantt\n    title FSE Project Timeline\n    dateFormat YYYY-MM-DD\n    section Initiation\n    Requirements gathering  :done, init1, 2025-01-15, 2025-02-15\n    section Execution\n    MVP Development        :active, exec1, 2025-02-16, 2025-08-31\n    section Closing\n    Handover & Docs        :closing, 2025-09-01, 2025-09-30\n```\n\n## Team Structure\n\n```mermaid\ngraph LR\n    PM[Majid - PM] --> Dev1[Ismail - Backend]\n    PM --> Dev2[Hanane - Frontend]\n    PM --> Admin[Admin - Oversight]\n```");

        createWikiPage("Technical Design", "technical-design", fse, dev1,
                "# Technical Design\n\n## System Architecture\n\n```mermaid\ngraph TB\n    subgraph Frontend\n        UI[React SPA]\n        Mobile[Mobile App]\n    end\n    subgraph Backend\n        API[REST API]\n        Auth[Auth Service]\n        Worker[Background Worker]\n    end\n    subgraph Data\n        PG[(PostgreSQL)]\n        Redis[(Redis)]\n        S3[Object Storage]\n    end\n    UI --> API\n    Mobile --> API\n    API --> Auth\n    API --> PG\n    API --> Redis\n    Worker --> PG\n    Worker --> S3\n```\n\n## Database Schema\n\n```mermaid\nerDiagram\n    USER ||--o{ TASK : creates\n    USER ||--o{ TIME_LOG : logs\n    PROJECT ||--o{ TASK : contains\n    PROJECT ||--o{ MEMBER : has\n    TASK ||--o{ TIME_LOG : tracks\n    PROJECT ||--o{ RAID_ITEM : manages\n```\n\n## API Endpoints\n\n| Method | Path | Description |\n|--------|------|------------- |\n| GET | /api/projects | List all projects |\n| POST | /api/projects | Create a project |\n| GET | /api/tasks | List all tasks |\n| POST | /api/time-logs | Log time |\n\n## Deployment Pipeline\n\n```mermaid\ngraph LR\n    Code[Code Push] --> CI[CI Build & Test]\n    CI --> Stage[Staging Deploy]\n    Stage --> Review[Code Review]\n    Review --> Prod[Production Deploy]\n```");

        createWikiPage("Getting Started", "getting-started", mobileApp, dev3,
                "# Getting Started\n\n## Setup\n\n1. Clone the repository\n2. Run `npm install`\n3. Configure environment variables\n4. Start with `npm run dev`\n\n## Development Workflow\n\n```mermaid\ngraph TD\n    A[Feature Branch] --> B[Local Testing]\n    B --> C[Pull Request]\n    C --> D[Code Review]\n    D --> |Approved| E[Merge to Main]\n    D --> |Changes Needed| A\n    E --> F[CI/CD Pipeline]\n    F --> G[Deploy to Staging]\n    G --> H[QA Testing]\n    H --> |Pass| I[Deploy to Production]\n    H --> |Fail| A\n```\n\n## Mobile App Architecture\n\n```mermaid\ngraph TD\n    App[React Native App] --> API[Backend API]\n    App --> Push[Push Notifications]\n    App --> Cache[Local Storage]\n    API --> DB[(Database)]\n    API --> Auth[OAuth Provider]\n```");

        String c4DisplayName = "dev".equals(mode) ? "Medocode" : "medERP";
        createWikiPage(c4DisplayName + " Roadmap", "roadmap", erpProject, younes,
                "# " + c4DisplayName + " Roadmap\n\n## 2025 Milestones\n\n```mermaid\ngantt\n    title " + c4DisplayName + " 2025 Roadmap\n    dateFormat YYYY-MM-DD\n    section Q1\n    Patient Management  :done, q1a, 2025-01-01, 2025-03-31\n    section Q2\n    Billing Module      :active, q2a, 2025-04-01, 2025-06-30\n    section Q3\n    Lab Integration     :q3a, 2025-07-01, 2025-09-30\n    section Q4\n    Pharmacy Module     :q4a, 2025-10-01, 2025-12-31\n```\n\n## Module Dependencies\n\n```mermaid\ngraph TD\n    Patient[Patient Module] --> Billing[Billing Module]\n    Patient --> Lab[Lab Integration]\n    Billing --> Insurance[Insurance Claims]\n    Lab --> Pharmacy[Pharmacy Module]\n    Insurance --> Reports[Reporting]\n```\n\n## Integration Points\n\n```mermaid\ngraph LR\n    HIS[Hospital Info System] --> API[" + c4DisplayName + " API]\n    LIS[Lab Info System] --> API\n    PIS[Pharmacy System] --> API\n    API --> DW[Data Warehouse]\n    API --> Portal[Patient Portal]\n```");

        createWikiPage("Project Charter", "project-charter", apiGateway, majid,
                "# API Gateway Project Charter\n\n## Scope\n\nCentral API gateway for service routing, rate limiting, and authentication.\n\n## Stakeholders\n\n```mermaid\ngraph TD\n    Sponsor[Salim - Executive Sponsor] --> PM[Majid - Project Manager]\n    PM --> Dev1[Ismail - Lead Developer]\n    PM --> Dev2[Wadii - Backend Developer]\n    PM --> QA[Admin - QA Lead]\n```\n\n## Risk Assessment\n\n```mermaid\nquadrantChart\n    title Risk Assessment\n    x-axis Low Impact --> High Impact\n    y-axis Low Probability --> High Probability\n    quadrant-1 High Impact Low Probability\n    quadrant-2 High Impact High Probability\n    quadrant-3 Low Impact Low Probability\n    quadrant-4 Low Impact High Probability\n    Vendor Lock-in: [0.3, 0.4]\n    Scalability: [0.8, 0.6]\n    Security Breach: [0.9, 0.3]\n    Team Turnover: [0.4, 0.5]\n```\n\n## Budget\n\n| Category | Amount (DH) |\n|----------|-------------|\n| Development | 50,000 |\n| Infrastructure | 15,000 |\n| Testing | 10,000 |\n| Contingency | 5,000 |");

        // Additional RAID items for remaining projects
        createRaidItem(eHealthPortal, RaidItem.RaidType.RISK, "Patient data privacy",
                "HIPAA compliance requirements for patient health information",
                RaidItem.RaidStatus.OPEN, 4, 5, "Engage privacy consultant and implement data encryption",
                majid, today.plusMonths(2));

        createRaidItem(eHealthPortal, RaidItem.RaidType.ASSUMPTION, "Hospital IT will provide API access",
                "Assuming existing hospital systems expose HL7/FHIR APIs",
                RaidItem.RaidStatus.OPEN, null, null, null, null, null);

        createRaidItem(mobilePay, RaidItem.RaidType.RISK, "Payment gateway integration complexity",
                "Multiple payment providers with different APIs and compliance rules",
                RaidItem.RaidStatus.OPEN, 3, 4, "Start with single provider, add others incrementally",
                pmHarmony, today.plusMonths(1));

        createRaidItem(mobilePay, RaidItem.RaidType.TASK, "PCI-DSS compliance gap",
                "Current architecture does not meet all PCI-DSS requirements",
                RaidItem.RaidStatus.MITIGATING, null, null, "Security audit scheduled, remediation plan in progress",
                dev4, today.plusWeeks(4));

        createRaidItem(dataWarehouse, RaidItem.RaidType.RISK, "Data quality from source systems",
                "Inconsistent data formats across source systems may affect analytics accuracy",
                RaidItem.RaidStatus.OPEN, 3, 5, "Implement data validation layer and ETL monitoring",
                dev1, today.plusMonths(3));

        createRaidItem(dataWarehouse, RaidItem.RaidType.DEPENDENCY, "Source system API availability",
                "Data extraction depends on uptime and API access of 5 source systems",
                RaidItem.RaidStatus.OPEN, null, null, null, majid, today.plusMonths(2));

        createRaidItem(footballTeam, RaidItem.RaidType.RISK, "Data privacy regulations",
                "Player health data subject to GDPR and local privacy laws",
                RaidItem.RaidStatus.OPEN, 3, 4, "Implement role-based access and data anonymization",
                youssef, today.plusMonths(2));

        createRaidItem(footballTeam, RaidItem.RaidType.ASSUMPTION, "Clubs will adopt the platform",
                "Assuming 70% of local clubs sign up within the first year",
                RaidItem.RaidStatus.OPEN, null, null, null, null, null);

        createRaidItem(infraUpgrade, RaidItem.RaidType.RISK, "Migration data loss",
                "Risk of data loss during migration from on-premise to cloud",
                RaidItem.RaidStatus.OPEN, 2, 5, "Implement incremental migration with rollback capability",
                dev1, today.plusMonths(2));

        createRaidItem(infraUpgrade, RaidItem.RaidType.TASK, "Legacy system compatibility",
                "Some legacy services cannot run on the new cloud infrastructure",
                RaidItem.RaidStatus.MITIGATING, null, null, "Containerization strategy being evaluated",
                dev3, today.plusWeeks(6));

        // Board columns
        List<TaskStatus> allStatuses = taskStatusRepository.findAll();
        createBoardColumns(fse, allStatuses);
        createBoardColumns(apiGateway, allStatuses);
        createBoardColumns(mobileApp, allStatuses);
        createBoardColumns(infraUpgrade, allStatuses);
        createBoardColumns(eHealthPortal, allStatuses);
        createBoardColumns(mobilePay, allStatuses);
        createBoardColumns(dataWarehouse, allStatuses);
        createBoardColumns(erpProject, allStatuses);
        createBoardColumns(footballTeam, allStatuses);

        // Sprints
        Sprint sprint1 = createSprint("Sprint 1", "FSE MVP features", fse,
                SprintStatus.ACTIVE, LocalDate.of(2025, 4, 1), LocalDate.of(2025, 4, 14));
        Sprint sprint2 = createSprint("Sprint 2", "FSE enhancements", fse,
                SprintStatus.PLANNING, LocalDate.of(2025, 4, 15), LocalDate.of(2025, 4, 28));
        Sprint sprintM1 = createSprint("Mobile Sprint 1", "Core mobile features", mobileApp,
                SprintStatus.ACTIVE, LocalDate.of(2025, 4, 1), LocalDate.of(2025, 4, 14));

        // Tasks for FSE
        TaskStatus todo = allStatuses.stream().filter(s -> s.getCategory() == TaskStatus.Category.TODO).findFirst().orElse(allStatuses.get(0));
        TaskStatus inProgress = allStatuses.stream().filter(s -> s.getCategory() == TaskStatus.Category.IN_PROGRESS).findFirst().orElse(allStatuses.get(1));
        TaskStatus done = allStatuses.stream().filter(s -> s.getCategory() == TaskStatus.Category.DONE).findFirst().orElse(allStatuses.get(2));
        TaskType dev = taskTypeRepository.findById(4L).orElse(null);
        TaskType mgmt = taskTypeRepository.findById(1L).orElse(null);
        TaskType test = taskTypeRepository.findById(6L).orElse(null);

        createTask("FSE-1", "User authentication flow", fse, done, Task.Priority.HIGH, dev, dev1, admin, sprint1, 0, LocalDate.of(2025, 3, 15));
        createTask("FSE-2", "Dashboard layout", fse, done, Task.Priority.HIGH, dev, dev2, admin, sprint1, 1, LocalDate.of(2025, 4, 1));
        createTask("FSE-3", "Profile management", fse, inProgress, Task.Priority.MEDIUM, dev, dev1, admin, sprint1, 2, LocalDate.of(2025, 6, 30));
        createTask("FSE-4", "Search functionality", fse, inProgress, Task.Priority.MEDIUM, dev, dev2, admin, sprint2, 3, LocalDate.of(2025, 7, 31));
        createTask("FSE-5", "Notification system", fse, todo, Task.Priority.LOW, dev, null, admin, sprint2, 4, LocalDate.of(2025, 8, 31));
        createTask("FSE-6", "Payment integration", fse, todo, Task.Priority.HIGH, dev, null, admin, null, 5, LocalDate.of(2025, 9, 15));
        createTask("FSE-7", "Analytics reporting", fse, todo, Task.Priority.MEDIUM, dev, null, majid, null, 6, null);

        // Tasks for Mobile App
        createTask("MA-1", "Login screen", mobileApp, done, Task.Priority.HIGH, dev, dev3, pmHarmony, sprintM1, 0, LocalDate.of(2025, 4, 15));
        createTask("MA-2", "Navigation framework", mobileApp, done, Task.Priority.HIGH, dev, dev4, pmHarmony, sprintM1, 1, LocalDate.of(2025, 5, 1));
        createTask("MA-3", "Push notifications", mobileApp, inProgress, Task.Priority.MEDIUM, dev, dev3, pmHarmony, sprintM1, 2, LocalDate.of(2025, 9, 30));
        createTask("MA-4", "Offline mode", mobileApp, todo, Task.Priority.HIGH, dev, null, pmHarmony, null, 3, LocalDate.of(2025, 10, 15));
        createTask("MA-5", "Camera integration", mobileApp, todo, Task.Priority.LOW, dev, null, pmHarmony, null, 4, null);

        // Tasks for API Gateway
        createTask("AG-1", "Rate limiting module", apiGateway, inProgress, Task.Priority.HIGH, dev, dev1, majid, null, 0, LocalDate.of(2026, 6, 30));
        createTask("AG-2", "Service discovery", apiGateway, todo, Task.Priority.HIGH, dev, null, majid, null, 1, LocalDate.of(2026, 9, 30));
        createTask("AG-3", "Load balancer config", apiGateway, todo, Task.Priority.MEDIUM, dev, null, majid, null, 2, LocalDate.of(2026, 11, 15));

        // External tasks (visible only to EXTERNAL users)
        Task extTask = createTask("FSE-8", "Client feedback on login flow", fse, todo, Task.Priority.MEDIUM, dev, basma, basma, null, 7, LocalDate.of(2025, 8, 15));
        extTask.setExternal(true);
        taskRepository.save(extTask);

        // Tasks for medERP
        createTask("MER-1", "Amelioration design", erpProject, inProgress, Task.Priority.HIGH, dev, younes, younes, null, 0, LocalDate.of(2025, 9, 30));
        createTask("MER-2", "Homologation FSE", erpProject, todo, Task.Priority.HIGH, dev, younes, younes, null, 1, LocalDate.of(2025, 12, 31));

        // Tasks for Football Team Manager
        createTask("FTM-1", "Player registration module", footballTeam, done, Task.Priority.HIGH, dev, walid, youssef, null, 0, LocalDate.of(2025, 5, 31));
        createTask("FTM-2", "Match scheduling system", footballTeam, inProgress, Task.Priority.HIGH, dev, walid, youssef, null, 1, LocalDate.of(2025, 10, 31));
        createTask("FTM-3", "Training session planner", footballTeam, inProgress, Task.Priority.MEDIUM, dev, dev1, youssef, null, 2, LocalDate.of(2025, 11, 15));
        createTask("FTM-4", "Player statistics dashboard", footballTeam, todo, Task.Priority.HIGH, dev, null, youssef, null, 3, LocalDate.of(2025, 11, 30));
        createTask("FTM-5", "Team lineup builder", footballTeam, todo, Task.Priority.MEDIUM, dev, null, youssef, null, 4, null);
        createTask("FTM-6", "Injury tracking", footballTeam, todo, Task.Priority.MEDIUM, dev, null, youssef, null, 5, LocalDate.of(2026, 1, 31));

        // Labels
        createLabel(fse, "Frontend", "#3B82F6");
        createLabel(fse, "Backend", "#10B981");
        createLabel(fse, "Bug", "#EF4444");
        createLabel(mobileApp, "iOS", "#8B5CF6");
        createLabel(mobileApp, "Android", "#F59E0B");

        // Time logs — each contributor logs 8h/day on their tasks for the last 10 days,
        // but with 1-3 recent days without logs to simulate delayed time entry
        // dev1 (Ismail): FSE-1 (done), FSE-3 (in progress), AG-1 (in progress), FTM-3 (in progress)
        String[] dev1Descriptions = {"Implementation", "Bug fixes and testing", "Code review", "Feature development", "Refactoring", "Unit tests", "Integration work", "Documentation", "Deployment prep", "Optimization"};
        for (int i = 10; i >= 3; i--) {
            createTimeLog(fse, "FSE-3", dev1, new BigDecimal("8"), today.minusDays(i), dev1Descriptions[10 - i] + " - profile management");
        }
        createTimeLog(fse, "FSE-1", dev1, new BigDecimal("8"), today.minusDays(10), "Auth flow - complete");
        for (int i = 9; i >= 4; i--) {
            createTimeLog(apiGateway, "AG-1", dev1, new BigDecimal("8"), today.minusDays(i), "Rate limiting work");
        }

        // dev2 (Hanane): FSE-2 (done), FSE-4 (in progress)
        for (int i = 10; i >= 2; i--) {
            createTimeLog(fse, "FSE-4", dev2, new BigDecimal("8"), today.minusDays(i), "Search functionality work");
        }
        createTimeLog(fse, "FSE-2", dev2, new BigDecimal("8"), today.minusDays(10), "Dashboard layout - complete");

        // dev3 (Wadii): MA-1 (done), MA-3 (in progress)
        createTimeLog(mobileApp, "MA-1", dev3, new BigDecimal("8"), today.minusDays(12), "Login screen - complete");
        for (int i = 10; i >= 4; i--) {
            createTimeLog(mobileApp, "MA-3", dev3, new BigDecimal("8"), today.minusDays(i), "Push notifications development");
        }

        // dev4 (Ahmed): MA-2 (done)
        createTimeLog(mobileApp, "MA-2", dev4, new BigDecimal("8"), today.minusDays(11), "Navigation - complete");
        for (int i = 10; i >= 3; i--) {
            createTimeLog(mobileApp, "MA-3", dev4, new BigDecimal("8"), today.minusDays(i), "Mobile UI development");
        }

        // younes (medERP): MER-1 (in progress), MER-2 (todo)
        for (int i = 10; i >= 4; i--) {
            createTimeLog(erpProject, "MER-1", younes, new BigDecimal("8"), today.minusDays(i), "Design amelioration work");
        }

        // walid (MyTeam): FTM-1 (done), FTM-2 (in progress)
        createTimeLog(footballTeam, "FTM-1", walid, new BigDecimal("8"), today.minusDays(11), "Player registration - complete");
        for (int i = 10; i >= 3; i--) {
            createTimeLog(footballTeam, "FTM-2", walid, new BigDecimal("8"), today.minusDays(i), "Match scheduling development");
        }

        // RAID items
        createRaidItem(fse, RaidItem.RaidType.RISK, "Data breach vulnerability",
                "Customer PII may be exposed if authentication tokens are compromised",
                RaidItem.RaidStatus.MITIGATING, 4, 5, "Implement token rotation and encryption at rest",
                dev1, today.plusMonths(1));

        createRaidItem(fse, RaidItem.RaidType.RISK, "Third-party API downtime",
                "Payment provider API has had 3 outages in the last quarter",
                RaidItem.RaidStatus.OPEN, 3, 4, "Implement fallback payment provider",
                majid, today.plusMonths(2));

        createRaidItem(fse, RaidItem.RaidType.ASSUMPTION, "Customers will adopt self-service portal",
                "Assuming 60% adoption rate within 6 months based on industry benchmarks",
                RaidItem.RaidStatus.OPEN, null, null, null, null, null);

        createRaidItem(fse, RaidItem.RaidType.DEPENDENCY, "SSO provider integration",
                "Depends on corporate IT completing SSO setup",
                RaidItem.RaidStatus.OPEN, null, null, null, majid, today.plusWeeks(2));

        createRaidItem(mobileApp, RaidItem.RaidType.RISK, "App store rejection",
                "Apple may reject the app for privacy policy compliance",
                RaidItem.RaidStatus.OPEN, 3, 5, "Early submission for review and policy alignment",
                pmHarmony, today.plusMonths(1));

        createRaidItem(mobileApp, RaidItem.RaidType.TASK, "Memory leak on Android",
                "Android builds showing increasing memory usage over time",
                RaidItem.RaidStatus.MITIGATING, null, null, null, dev3, today.plusWeeks(3));

        createRaidItem(apiGateway, RaidItem.RaidType.RISK, "Scalability bottleneck",
                "Current architecture may not handle 10x traffic growth",
                RaidItem.RaidStatus.OPEN, 2, 5, "Design horizontal scaling strategy",
                dev1, today.plusMonths(3));

        createRaidItem(apiGateway, RaidItem.RaidType.ASSUMPTION, "Microservices adoption will continue",
                "Assuming teams will adopt the gateway for new services",
                RaidItem.RaidStatus.OPEN, null, null, null, null, null);

        createRaidItem(infraUpgrade, RaidItem.RaidType.DEPENDENCY, "Cloud vendor contract renewal",
                "Infrastructure upgrade depends on cloud contract renewal",
                RaidItem.RaidStatus.OPEN, null, null, null, majid, today.plusMonths(2));

        // Public holidays (Morocco 2025)
        createHoliday(LocalDate.of(2025, 1, 1), "New Year's Day", null);
        createHoliday(LocalDate.of(2025, 1, 11), "Independence Manifesto Day", null);
        createHoliday(LocalDate.of(2025, 5, 1), "Labour Day", null);
        createHoliday(LocalDate.of(2025, 7, 30), "Throne Day", null);
        createHoliday(LocalDate.of(2025, 8, 14), "Oued Ed-Dahab Day", null);
        createHoliday(LocalDate.of(2025, 8, 20), "Revolution Day", null);
        createHoliday(LocalDate.of(2025, 8, 21), "Youth Day", null);
        createHoliday(LocalDate.of(2025, 11, 6), "Green March Day", null);
        createHoliday(LocalDate.of(2025, 11, 18), "Independence Day", null);

        // Locations
        Location plateauHightech = createLocation("Plateau 19 Imb Hightech", c1Name + " main office at Hay Riad", null, company1, 1);
        Location camelias = createLocation("Camelias", c1Name + " secondary office", null, company1, 2);

        Location villaAnnasim = createLocation("Villa Annasim", c2Name + " main office", null, company2, 1);
        Location centreAlKassous = createLocation("Centre Al Kassous", c2Name + " branch office", null, company2, 2);

        Location plateauBouskoura = createLocation("Plateau Bouskoura", c3Name + " office", null, company3, 1);

        Location bureauTechnoparc = createLocation("Bureau technoparc", c4Name + " office", null, company4, 1);

        // Assets
        createAsset("MacBook Pro 16\"", Asset.Type.COMPUTER, Asset.Status.ASSIGNED, plateauHightech, dev1, company1,
                "MBP-2024-001", LocalDate.of(2024, 1, 15), new BigDecimal("2400"));
        createAsset("Dell Latitude 5540", Asset.Type.COMPUTER, Asset.Status.ASSIGNED, plateauHightech, dev2, company1,
                "DL-5540-002", LocalDate.of(2024, 3, 1), new BigDecimal("1200"));
        createAsset("Dell PowerEdge R740", Asset.Type.SERVER, Asset.Status.IN_USE, camelias, null, company1,
                "SRV-R740-001", LocalDate.of(2023, 6, 1), new BigDecimal("8500"));
        createAsset("HP ProLiant DL380", Asset.Type.SERVER, Asset.Status.IN_USE, camelias, null, company1,
                "SRV-DL380-002", LocalDate.of(2023, 6, 1), new BigDecimal("7200"));
        createAsset("iPhone 15 Pro", Asset.Type.MOBILE, Asset.Status.ASSIGNED, null, majid, company1,
                "IPH-15PRO-001", LocalDate.of(2024, 2, 1), new BigDecimal("1100"));
        createAsset("Samsung Galaxy S24", Asset.Type.MOBILE, Asset.Status.IN_STOCK, null, null, company1,
                "SGS-S24-002", LocalDate.of(2024, 4, 1), new BigDecimal("900"));
        createAsset("Toyota Hilux", Asset.Type.VEHICLE, Asset.Status.IN_USE, null, dev3, company2,
                "VHC-HILUX-001", LocalDate.of(2022, 8, 1), new BigDecimal("35000"));
        createAsset("Samsung Microwave", Asset.Type.MICROWAVE, Asset.Status.IN_USE, villaAnnasim, null, company2,
                "MCI-SAM-001", LocalDate.of(2023, 3, 1), new BigDecimal("150"));
        createAsset("ThinkPad X1 Carbon", Asset.Type.COMPUTER, Asset.Status.ASSIGNED, null, dev3, company2,
                "TP-X1C-001", LocalDate.of(2024, 1, 10), new BigDecimal("1800"));
        createAsset("MacBook Air M2", Asset.Type.COMPUTER, Asset.Status.ASSIGNED, null, dev4, company2,
                "MBA-M2-001", LocalDate.of(2024, 2, 15), new BigDecimal("1300"));
        createAsset("Dell Monitor 27\"", Asset.Type.OTHER, Asset.Status.IN_USE, plateauHightech, null, company1,
                "MON-DELL27-001", LocalDate.of(2024, 1, 20), new BigDecimal("350"));
        createAsset("Cisco Switch C9200", Asset.Type.OTHER, Asset.Status.IN_USE, camelias, null, company1,
                "NET-CS9200-001", LocalDate.of(2023, 5, 1), new BigDecimal("2800"));
        createAsset("iPad Pro 12.9\"", Asset.Type.MOBILE, Asset.Status.MAINTENANCE, null, null, company3,
                "IPD-PRO-001", LocalDate.of(2023, 11, 1), new BigDecimal("1100"));
        createAsset("ThinkPad T14s", Asset.Type.COMPUTER, Asset.Status.ASSIGNED, null, walid, company3,
                "TP-T14S-001", LocalDate.of(2024, 3, 1), new BigDecimal("1400"));
        createAsset("Coffee Machine Jura", Asset.Type.OTHER, Asset.Status.IN_STOCK, null, null, company1,
                "BEV-JURA-001", LocalDate.of(2024, 5, 1), new BigDecimal("800"));
    }

    private User createUser(String username, String email, String firstName, String lastName, User.Role role, Company company) {
        return createUser(username, email, firstName, lastName, role, company, null, null, null, null);
    }

    private User createUser(String username, String email, String firstName, String lastName, User.Role role, Company company,
                            String jobTitle, String department, String phone, LocalDate hireDate) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode("password123"));
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setRole(role);
        user.setActive(true);
        user.setCompany(company);
        user.setJobTitle(jobTitle);
        user.setDepartment(department);
        user.setPhone(phone);
        user.setHireDate(hireDate);
        return userRepository.save(user);
    }

    private Company createCompany(String name, String key, String description, String address, String website, String logo, Integer order) {
        Company company = new Company();
        company.setName(name);
        company.setKey(key);
        company.setDescription(description);
        company.setAddress(address);
        company.setWebsite(website);
        company.setLogo(logo);
        company.setOrder(order);
        company.setActive(true);
        return companyRepository.save(company);
    }

    private OrganizationConfig createOrgConfig(String name, Company company, String address, String website, String logo) {
        OrganizationConfig config = new OrganizationConfig();
        config.setName(name);
        config.setAddress(address);
        config.setWebsite(website);
        config.setLogo(logo);
        config.setCurrency("DH");
        config.setCompany(company);
        return organizationConfigRepository.save(config);
    }

    private UserRate createUserRate(User user, BigDecimal hourlyRate, LocalDate effectiveFrom) {
        UserRate rate = new UserRate();
        rate.setUser(user);
        rate.setHourlyRate(hourlyRate);
        rate.setEffectiveFrom(effectiveFrom);
        return userRateRepository.save(rate);
    }

    private Client createClient(String name, String industry, Company company) {
        Client client = new Client();
        client.setName(name);
        client.setIndustry(industry);
        client.setCompany(company);
        return clientRepository.save(client);
    }

    private Program createProgram(String name, String key, String description, User manager, Company company) {
        Program program = new Program();
        program.setName(name);
        program.setKey(key);
        program.setDescription(description);
        program.setManager(manager);
        program.setCompany(company);
        return programRepository.save(program);
    }

    private Project createProject(String name, String key, String description, Program program,
                                  User manager, Project.Stage stage, int strategicScore,
                                  BigDecimal plannedValue, BigDecimal budget, BigDecimal budgetSpent,
                                  LocalDate targetStartDate, LocalDate targetEndDate, Company company) {
        Project project = new Project();
        project.setName(name);
        project.setKey(key);
        project.setDescription(description);
        project.setProgram(program);
        project.setManager(manager);
        project.setStage(stage);
        project.setStrategicScore(strategicScore);
        project.setPlannedValue(plannedValue);
        project.setBudget(budget);
        project.setBudgetSpent(budgetSpent);
        project.setTargetStartDate(targetStartDate);
        project.setTargetEndDate(targetEndDate);
        project.setCompany(company);
        return projectRepository.save(project);
    }

    private void addMember(Project project, User user) {
        projectMemberRepository.save(new ProjectMember(project, user));
    }

    private void addFavorite(User user, Project project) {
        projectFavoriteRepository.save(new ProjectFavorite(user, project));
    }

    private void createBoardColumns(Project project, List<TaskStatus> statuses) {
        int pos = 0;
        for (TaskStatus status : statuses) {
            boardColumnRepository.save(new BoardColumn(project, status, pos++));
        }
    }

    private Sprint createSprint(String name, String goal, Project project, SprintStatus status,
                               LocalDate startDate, LocalDate endDate) {
        Sprint sprint = new Sprint();
        sprint.setName(name);
        sprint.setGoal(goal);
        sprint.setProject(project);
        sprint.setStatus(status);
        sprint.setStartDate(startDate);
        sprint.setEndDate(endDate);
        return sprintRepository.save(sprint);
    }

    private Task createTask(String taskKey, String title, Project project, TaskStatus status,
                             Task.Priority priority, TaskType type, User assignee, User reporter,
                             Sprint sprint, int position, LocalDate dueDate) {
        Task task = new Task();
        task.setTaskKey(taskKey);
        task.setTitle(title);
        task.setProject(project);
        task.setStatus(status);
        task.setPriority(priority);
        task.setType(type);
        task.setAssignee(assignee);
        task.setReporter(reporter);
        task.setSprint(sprint);
        task.setPosition(position);
        task.setDueDate(dueDate);
        return taskRepository.save(task);
    }

    private Label createLabel(Project project, String name, String color) {
        Label label = new Label();
        label.setName(name);
        label.setColor(color);
        label.setProject(project);
        return labelRepository.save(label);
    }

    private void createTimeLog(Project project, String taskKey, User user, BigDecimal hours,
                               LocalDate logDate, String description) {
        List<Task> tasks = taskRepository.findByProjectId(project.getId(), org.springframework.data.domain.PageRequest.of(0, 100))
                .stream().filter(i -> i.getTaskKey().equals(taskKey)).toList();
        if (tasks.isEmpty()) return;
        Task task = tasks.get(0);

        TimeLog log = new TimeLog();
        log.setTask(task);
        log.setUser(user);
        log.setHours(hours);
        log.setLogDate(logDate);
        log.setDescription(description);
        timeLogRepository.save(log);
    }

    private RaidItem createRaidItem(Project project, RaidItem.RaidType type, String title, String description,
                                    RaidItem.RaidStatus status, Integer probability, Integer impact,
                                    String mitigationPlan, User owner, LocalDate dueDate) {
        RaidItem item = new RaidItem();
        item.setProject(project);
        item.setType(type);
        item.setTitle(title);
        item.setDescription(description);
        item.setStatus(status);
        item.setProbability(probability);
        item.setImpact(impact);
        item.setMitigationPlan(mitigationPlan);
        item.setOwner(owner);
        item.setDueDate(dueDate);
        return raidItemRepository.save(item);
    }

    private void createHoliday(LocalDate date, String name, Company company) {
        PublicHoliday holiday = new PublicHoliday();
        holiday.setDate(date);
        holiday.setName(name);
        holiday.setCompany(company);
        publicHolidayRepository.save(holiday);
    }

    private Phase createPhase(String name, String description, Project project, int position,
                              LocalDate startDate, LocalDate endDate) {
        Phase phase = new Phase();
        phase.setName(name);
        phase.setDescription(description);
        phase.setProject(project);
        phase.setPosition(position);
        phase.setStartDate(startDate);
        phase.setEndDate(endDate);
        return phaseRepository.save(phase);
    }

    private Deliverable createDeliverable(String name, String description, Phase phase,
                                           DeliverableState state, LocalDate dueDate) {
        Deliverable deliverable = new Deliverable();
        deliverable.setName(name);
        deliverable.setDescription(description);
        deliverable.setPhase(phase);
        deliverable.setState(state);
        deliverable.setDueDate(dueDate);
        return deliverableRepository.save(deliverable);
    }

    private WikiPage createWikiPage(String title, String slug, Project project, User author, String content) {
        WikiPage page = new WikiPage();
        page.setTitle(title);
        page.setSlug(slug);
        page.setProject(project);
        page.setAuthor(author);
        page.setContent(content);
        page.setPosition(0);
        return wikiPageRepository.save(page);
    }

    private Location createLocation(String name, String description, Location parent, Company company, Integer order) {
        Location location = new Location();
        location.setName(name);
        location.setDescription(description);
        location.setParent(parent);
        location.setCompany(company);
        location.setOrder(order);
        location.setActive(true);
        return locationRepository.save(location);
    }

    private Asset createAsset(String name, Asset.Type type, Asset.Status status, Location location, User user, Company company,
                              String identifier, LocalDate purchaseDate, BigDecimal purchaseCost) {
        Asset asset = new Asset();
        asset.setName(name);
        asset.setType(type);
        asset.setStatus(status);
        asset.setLocation(location);
        asset.setUser(user);
        asset.setCompany(company);
        asset.setIdentifier(identifier);
        asset.setPurchaseDate(purchaseDate);
        asset.setPurchaseCost(purchaseCost);
        asset.setActive(true);
        return assetRepository.save(asset);
    }
}