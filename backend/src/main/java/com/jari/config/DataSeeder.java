package com.jari.config;

import com.jari.company.Company;
import com.jari.company.CompanyRepository;
import com.jari.issue.Issue;
import com.jari.issue.IssueRepository;
import com.jari.pmo.RaidItem;
import com.jari.pmo.RaidItemRepository;
import com.jari.project.BoardColumn;
import com.jari.project.BoardColumnRepository;
import com.jari.project.Label;
import com.jari.project.LabelRepository;
import com.jari.project.Project;
import com.jari.project.ProjectFavorite;
import com.jari.project.ProjectFavoriteRepository;
import com.jari.project.ProjectMember;
import com.jari.project.ProjectMemberRepository;
import com.jari.project.ProjectRepository;
import com.jari.program.Program;
import com.jari.program.ProgramRepository;
import com.jari.sprint.Sprint;
import com.jari.sprint.Sprint.SprintStatus;
import com.jari.sprint.SprintRepository;
import com.jari.timetracking.TimeLog;
import com.jari.timetracking.TimeLogRepository;
import com.jari.timetracking.UserRate;
import com.jari.timetracking.UserRateRepository;
import com.jari.user.User;
import com.jari.user.UserRepository;
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

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CompanyRepository companyRepository;
    private final OrganizationConfigRepository organizationConfigRepository;
    private final ProgramRepository programRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final IssueRepository issueRepository;
    private final IssueStatusRepository issueStatusRepository;
    private final IssueTypeRepository issueTypeRepository;
    private final BoardColumnRepository boardColumnRepository;
    private final SprintRepository sprintRepository;
    private final LabelRepository labelRepository;
    private final RaidItemRepository raidItemRepository;
    private final TimeLogRepository timeLogRepository;
    private final UserRateRepository userRateRepository;
    private final ProjectFavoriteRepository projectFavoriteRepository;
    private final PublicHolidayRepository publicHolidayRepository;

    public DataSeeder(UserRepository userRepository,
                      PasswordEncoder passwordEncoder,
                      CompanyRepository companyRepository,
                      OrganizationConfigRepository organizationConfigRepository,
                      ProgramRepository programRepository,
                      ProjectRepository projectRepository,
                      ProjectMemberRepository projectMemberRepository,
                      IssueRepository issueRepository,
                      IssueStatusRepository issueStatusRepository,
                      IssueTypeRepository issueTypeRepository,
                      BoardColumnRepository boardColumnRepository,
                      SprintRepository sprintRepository,
                      LabelRepository labelRepository,
                      RaidItemRepository raidItemRepository,
                      TimeLogRepository timeLogRepository,
                      UserRateRepository userRateRepository,
                      ProjectFavoriteRepository projectFavoriteRepository,
                      PublicHolidayRepository publicHolidayRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.companyRepository = companyRepository;
        this.organizationConfigRepository = organizationConfigRepository;
        this.programRepository = programRepository;
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.issueRepository = issueRepository;
        this.issueStatusRepository = issueStatusRepository;
        this.issueTypeRepository = issueTypeRepository;
        this.boardColumnRepository = boardColumnRepository;
        this.sprintRepository = sprintRepository;
        this.labelRepository = labelRepository;
        this.raidItemRepository = raidItemRepository;
        this.timeLogRepository = timeLogRepository;
        this.userRateRepository = userRateRepository;
        this.projectFavoriteRepository = projectFavoriteRepository;
        this.publicHolidayRepository = publicHolidayRepository;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 1) return;

        // Companies
        Company netopia = createCompany("Netopia", "NTO", "Digital innovation and technology solutions",
                "Imb hightech, av Ennakhil, Hay Riad, Rabat", "http://www.netopia.ma", "https://mederp.net/downloads/nemo/netopia.jpg", 1);
        Company harmony = createCompany("Harmony", "HRM", "Consulting and organizational development",
                "14 Rue Annasim, Hay Riad, Rabat", "http://www.harmony.ma", "https://mederp.net/downloads/nemo/harmony.jpg", 2);
        Company myteam = createCompany("MyTeam", "MTM", "Team collaboration and productivity tools",
                "Imb 5, Bouskoura, Casablanca", "http://www.myteam.ma", "https://mederp.net/downloads/nemo/myteam.jpg", 3);
        Company mederp = createCompany("medERP", "MER", "Healthcare ERP solutions and medical information systems",
                "601, technopark, Rabat", "http://www.mederp.ma", "https://mederp.net/downloads/nemo/mederp.jpg", 4);

        // Organization config (global only — companies use their own address/website/logo fields)
        createOrgConfig("Netopia Group", null,
                "Imb hightech, av Ennakhil, Hay Riad, Rabat", "http://www.netopia.ma", "https://mederp.net/downloads/nemo/group.jpg");

        // Users
        User admin = createUser("admin", "admin@netopia.ma", "Admin", "User", User.Role.ADMIN, null,
                "System Administrator", "IT", "+212 600 000 001", LocalDate.of(2023, 1, 15));
        User majid = createUser("majid", "majid@netopia.ma", "Majid", "Hassan", User.Role.MANAGER, netopia,
                "Project Manager", "Engineering", "+212 600 000 002", LocalDate.of(2023, 3, 1));
        User dev1 = createUser("ismail", "ismail@netopia.ma", "Ismail", "Baraka", User.Role.CONTRIBUTOR, netopia,
                "Senior Developer", "Engineering", "+212 600 000 003", LocalDate.of(2023, 5, 15));
        User dev2 = createUser("hanane", "hanane@netopia.ma", "Hanane", "Machkour", User.Role.CONTRIBUTOR, netopia,
                "Frontend Developer", "Engineering", "+212 600 000 004", LocalDate.of(2024, 1, 10));
        User dev3 = createUser("wadii", "wadii@netopia.ma", "Wadii", "Mokhtari", User.Role.CONTRIBUTOR, harmony,
                "Backend Developer", "Engineering", "+212 600 000 005", LocalDate.of(2024, 2, 1));
        User dev4 = createUser("ahmed", "ahmed@netopia.ma", "Ahmed", "Azouzi", User.Role.CONTRIBUTOR, harmony,
                "Full-Stack Developer", "Engineering", "+212 600 000 006", LocalDate.of(2024, 3, 15));
        User pmHarmony = createUser("karima", "karima@netopia.ma", "Karima", "Chari", User.Role.MANAGER, harmony,
                "Delivery Manager", "Operations", "+212 600 000 007", LocalDate.of(2023, 6, 1));
        User salim = createUser("salim", "salim@netopia.ma", "Salim", "Rachidi", User.Role.EXECUTIVE, null,
                "CEO", "Executive", "+212 600 000 008", LocalDate.of(2022, 1, 1));
        User bassamat = createUser("bassamat", "bassamat@netopia.ma", "Bassamat", "Tayeb", User.Role.EXTERNAL, null,
                "Consultant", null, null, LocalDate.of(2025, 1, 10));
        User younes = createUser("younes", "younes@mederp.net", "Younes", "Alami", User.Role.CONTRIBUTOR, mederp,
                "DevOps Engineer", "Infrastructure", "+212 600 000 010", LocalDate.of(2024, 7, 1));
        User youssef = createUser("youssef", "youssef@myteam.ma", "Youssef", "Bennani", User.Role.MANAGER, myteam,
                "Team Lead", "Engineering", "+212 600 000 011", LocalDate.of(2023, 9, 1));
        User walid = createUser("walid", "walid@myteam.ma", "Walid", "El Idrissi", User.Role.CONTRIBUTOR, myteam,
                "QA Engineer", "Quality", "+212 600 000 012", LocalDate.of(2024, 4, 15));
        User mehdi = createUser("mehdi", "mehdi@netopia.ma", "Mehdi", "El Amrani", User.Role.HR, null,
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
        Program ehealth = createProgram("eHealth", "EH", "Digital health transformation initiative", majid, netopia);
        Program mobilePlatform = createProgram("Mobile Platform", "MOB", "Mobile app platform development", pmHarmony, harmony);
        Program globalInit = createProgram("Global Initiative", "GI", "Cross-company strategic initiative", salim, null);
        Program medErpProgram = createProgram("medERP", "MER", "Healthcare ERP and medical information systems", salim, mederp);

        // Projects with PMO fields
        Project fse = createProject("FSE", "FSE", "Full Stack Engineering platform",
                ehealth, majid, Project.Stage.EXECUTION, 8,
                new BigDecimal("150000"), new BigDecimal("150000"), new BigDecimal("12000"),
                LocalDate.of(2025, 1, 15), LocalDate.of(2025, 9, 30), netopia);

        Project apiGateway = createProject("API Gateway", "AG", "Central API gateway and service mesh",
                ehealth, majid, Project.Stage.PLANNING, 6,
                new BigDecimal("80000"), new BigDecimal("80000"), new BigDecimal("3500"),
                LocalDate.of(2025, 3, 1), LocalDate.of(2025, 12, 15), netopia);

        Project mobileApp = createProject("Mobile App", "MA", "Cross-platform mobile application",
                mobilePlatform, pmHarmony, Project.Stage.EXECUTION, 7,
                new BigDecimal("200000"), new BigDecimal("200000"), new BigDecimal("45000"),
                LocalDate.of(2025, 2, 1), LocalDate.of(2025, 10, 31), harmony);

        Project infraUpgrade = createProject("Infrastructure Upgrade", "IU", "Cloud infrastructure modernization",
                globalInit, salim, Project.Stage.INITIATION, 5,
                new BigDecimal("50000"), new BigDecimal("50000"), BigDecimal.ZERO,
                LocalDate.of(2025, 6, 1), LocalDate.of(2025, 11, 30), null);

        // Additional project per program
        Project eHealthPortal = createProject("Patient Portal", "PP", "Patient-facing health information portal",
                ehealth, majid, Project.Stage.INITIATION, 6,
                new BigDecimal("95000"), new BigDecimal("95000"), BigDecimal.ZERO,
                LocalDate.of(2025, 7, 1), LocalDate.of(2026, 3, 31), netopia);

        Project mobilePay = createProject("Mobile Payments", "MP", "In-app payment and billing integration",
                mobilePlatform, pmHarmony, Project.Stage.PLANNING, 7,
                new BigDecimal("120000"), new BigDecimal("120000"), new BigDecimal("5000"),
                LocalDate.of(2025, 5, 1), LocalDate.of(2025, 12, 31), harmony);

        Project dataWarehouse = createProject("Data Warehouse", "DW", "Enterprise data warehouse and analytics platform",
                globalInit, salim, Project.Stage.PLANNING, 8,
                new BigDecimal("180000"), new BigDecimal("180000"), new BigDecimal("10000"),
                LocalDate.of(2025, 8, 1), LocalDate.of(2026, 6, 30), null);

        Project medErpProject = createProject("medERP", "MER", "Healthcare ERP platform for hospital and clinic management",
                medErpProgram, younes, Project.Stage.EXECUTION, 7,
                new BigDecimal("250000"), new BigDecimal("250000"), new BigDecimal("30000"),
                LocalDate.of(2025, 1, 1), LocalDate.of(2025, 12, 31), mederp);

        Project footballTeam = createProject("Football Team Manager", "FTM", "Football team management and player tracking platform",
                null, youssef, Project.Stage.EXECUTION, 7,
                new BigDecimal("120000"), new BigDecimal("120000"), new BigDecimal("18000"),
                LocalDate.of(2025, 3, 1), LocalDate.of(2025, 11, 30), myteam);

        // Add members
        addMember(fse, admin);
        addMember(fse, dev1);
        addMember(fse, dev2);
        addMember(apiGateway, dev1);
        addMember(apiGateway, admin);
        addMember(mobileApp, dev3);
        addMember(mobileApp, dev4);
        addMember(mobileApp, pmHarmony);
        addMember(mobileApp, admin);
        addMember(infraUpgrade, dev1);
        addMember(infraUpgrade, dev3);
        addMember(eHealthPortal, dev2);
        addMember(eHealthPortal, majid);
        addMember(eHealthPortal, admin);
        addMember(mobilePay, dev3);
        addMember(mobilePay, dev4);
        addMember(mobilePay, pmHarmony);
        addMember(mobilePay, admin);
        addMember(dataWarehouse, dev1);
        addMember(dataWarehouse, salim);
        addMember(dataWarehouse, admin);
        addMember(medErpProject, younes);
        addMember(medErpProject, admin);
        addMember(footballTeam, youssef);
        addMember(footballTeam, walid);
        addMember(footballTeam, dev1);
        addMember(footballTeam, admin);

        // External user assigned to FSE
        bassamat.setAssignedProject(fse);
        userRepository.save(bassamat);
        addMember(fse, bassamat);

        // Favorites (per-user)
        addFavorite(admin, fse);
        addFavorite(admin, mobileApp);

        // Board columns
        List<IssueStatus> allStatuses = issueStatusRepository.findAll();
        createBoardColumns(fse, allStatuses);
        createBoardColumns(apiGateway, allStatuses);
        createBoardColumns(mobileApp, allStatuses);
        createBoardColumns(infraUpgrade, allStatuses);
        createBoardColumns(eHealthPortal, allStatuses);
        createBoardColumns(mobilePay, allStatuses);
        createBoardColumns(dataWarehouse, allStatuses);
        createBoardColumns(medErpProject, allStatuses);
        createBoardColumns(footballTeam, allStatuses);

        // Sprints
        Sprint sprint1 = createSprint("Sprint 1", "FSE MVP features", fse,
                SprintStatus.ACTIVE, LocalDate.of(2025, 4, 1), LocalDate.of(2025, 4, 14));
        Sprint sprint2 = createSprint("Sprint 2", "FSE enhancements", fse,
                SprintStatus.PLANNING, LocalDate.of(2025, 4, 15), LocalDate.of(2025, 4, 28));
        Sprint sprintM1 = createSprint("Mobile Sprint 1", "Core mobile features", mobileApp,
                SprintStatus.ACTIVE, LocalDate.of(2025, 4, 1), LocalDate.of(2025, 4, 14));

        // Issues for FSE
        IssueStatus todo = allStatuses.stream().filter(s -> s.getCategory() == IssueStatus.Category.TODO).findFirst().orElse(allStatuses.get(0));
        IssueStatus inProgress = allStatuses.stream().filter(s -> s.getCategory() == IssueStatus.Category.IN_PROGRESS).findFirst().orElse(allStatuses.get(1));
        IssueStatus done = allStatuses.stream().filter(s -> s.getCategory() == IssueStatus.Category.DONE).findFirst().orElse(allStatuses.get(2));
        IssueType dev = issueTypeRepository.findById(4L).orElse(null);
        IssueType mgmt = issueTypeRepository.findById(1L).orElse(null);
        IssueType test = issueTypeRepository.findById(6L).orElse(null);

        createIssue("FSE-1", "User authentication flow", fse, done, Issue.Priority.HIGH, dev, dev1, admin, sprint1, 0);
        createIssue("FSE-2", "Dashboard layout", fse, done, Issue.Priority.HIGH, dev, dev2, admin, sprint1, 1);
        createIssue("FSE-3", "Profile management", fse, inProgress, Issue.Priority.MEDIUM, dev, dev1, admin, sprint1, 2);
        createIssue("FSE-4", "Search functionality", fse, inProgress, Issue.Priority.MEDIUM, dev, dev2, admin, sprint2, 3);
        createIssue("FSE-5", "Notification system", fse, todo, Issue.Priority.LOW, dev, null, admin, sprint2, 4);
        createIssue("FSE-6", "Payment integration", fse, todo, Issue.Priority.HIGH, dev, null, admin, null, 5);
        createIssue("FSE-7", "Analytics reporting", fse, todo, Issue.Priority.MEDIUM, dev, null, majid, null, 6);

        // Issues for Mobile App
        createIssue("MA-1", "Login screen", mobileApp, done, Issue.Priority.HIGH, dev, dev3, pmHarmony, sprintM1, 0);
        createIssue("MA-2", "Navigation framework", mobileApp, done, Issue.Priority.HIGH, dev, dev4, pmHarmony, sprintM1, 1);
        createIssue("MA-3", "Push notifications", mobileApp, inProgress, Issue.Priority.MEDIUM, dev, dev3, pmHarmony, sprintM1, 2);
        createIssue("MA-4", "Offline mode", mobileApp, todo, Issue.Priority.HIGH, dev, null, pmHarmony, null, 3);
        createIssue("MA-5", "Camera integration", mobileApp, todo, Issue.Priority.LOW, dev, null, pmHarmony, null, 4);

        // Issues for API Gateway
        createIssue("AG-1", "Rate limiting module", apiGateway, inProgress, Issue.Priority.HIGH, dev, dev1, majid, null, 0);
        createIssue("AG-2", "Service discovery", apiGateway, todo, Issue.Priority.HIGH, dev, null, majid, null, 1);
        createIssue("AG-3", "Load balancer config", apiGateway, todo, Issue.Priority.MEDIUM, dev, null, majid, null, 2);

        // External issues (visible only to EXTERNAL users)
        Issue extIssue = createIssue("FSE-8", "Client feedback on login flow", fse, todo, Issue.Priority.MEDIUM, dev, bassamat, bassamat, null, 7);
        extIssue.setExternal(true);
        issueRepository.save(extIssue);

        // Issues for medERP
        createIssue("MER-1", "Amelioration design", medErpProject, inProgress, Issue.Priority.HIGH, dev, younes, younes, null, 0);
        createIssue("MER-2", "Homologation FSE", medErpProject, todo, Issue.Priority.HIGH, dev, younes, younes, null, 1);

        // Issues for Football Team Manager
        createIssue("FTM-1", "Player registration module", footballTeam, done, Issue.Priority.HIGH, dev, walid, youssef, null, 0);
        createIssue("FTM-2", "Match scheduling system", footballTeam, inProgress, Issue.Priority.HIGH, dev, walid, youssef, null, 1);
        createIssue("FTM-3", "Training session planner", footballTeam, inProgress, Issue.Priority.MEDIUM, dev, dev1, youssef, null, 2);
        createIssue("FTM-4", "Player statistics dashboard", footballTeam, todo, Issue.Priority.HIGH, dev, null, youssef, null, 3);
        createIssue("FTM-5", "Team lineup builder", footballTeam, todo, Issue.Priority.MEDIUM, dev, null, youssef, null, 4);
        createIssue("FTM-6", "Injury tracking", footballTeam, todo, Issue.Priority.MEDIUM, dev, null, youssef, null, 5);

        // Labels
        createLabel(fse, "Frontend", "#3B82F6");
        createLabel(fse, "Backend", "#10B981");
        createLabel(fse, "Bug", "#EF4444");
        createLabel(mobileApp, "iOS", "#8B5CF6");
        createLabel(mobileApp, "Android", "#F59E0B");

        // Time logs for EVM (labor cost)
        LocalDate today = LocalDate.now();
        createTimeLog(fse, "FSE-3", dev1, new BigDecimal("6.5"), today.minusDays(4), "Profile API implementation");
        createTimeLog(fse, "FSE-3", dev1, new BigDecimal("4.0"), today.minusDays(3), "Profile validation logic");
        createTimeLog(fse, "FSE-4", dev2, new BigDecimal("7.0"), today.minusDays(3), "Search index setup");
        createTimeLog(fse, "FSE-4", dev2, new BigDecimal("5.0"), today.minusDays(2), "Search UI components");
        createTimeLog(fse, "FSE-1", dev1, new BigDecimal("8.0"), today.minusDays(10), "Auth flow - complete");
        createTimeLog(fse, "FSE-2", dev2, new BigDecimal("7.5"), today.minusDays(9), "Dashboard layout - complete");
        createTimeLog(mobileApp, "MA-3", dev3, new BigDecimal("6.0"), today.minusDays(2), "Push notification backend");
        createTimeLog(mobileApp, "MA-3", dev3, new BigDecimal("5.0"), today.minusDays(1), "Push notification UI");
        createTimeLog(mobileApp, "MA-1", dev3, new BigDecimal("8.0"), today.minusDays(12), "Login screen - complete");
        createTimeLog(mobileApp, "MA-2", dev4, new BigDecimal("7.0"), today.minusDays(11), "Navigation - complete");

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

        createRaidItem(mobileApp, RaidItem.RaidType.ISSUE, "Memory leak on Android",
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

    private void createBoardColumns(Project project, List<IssueStatus> statuses) {
        int pos = 0;
        for (IssueStatus status : statuses) {
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

    private Issue createIssue(String issueKey, String title, Project project, IssueStatus status,
                             Issue.Priority priority, IssueType type, User assignee, User reporter,
                             Sprint sprint, int position) {
        Issue issue = new Issue();
        issue.setIssueKey(issueKey);
        issue.setTitle(title);
        issue.setProject(project);
        issue.setStatus(status);
        issue.setPriority(priority);
        issue.setType(type);
        issue.setAssignee(assignee);
        issue.setReporter(reporter);
        issue.setSprint(sprint);
        issue.setPosition(position);
        return issueRepository.save(issue);
    }

    private Label createLabel(Project project, String name, String color) {
        Label label = new Label();
        label.setName(name);
        label.setColor(color);
        label.setProject(project);
        return labelRepository.save(label);
    }

    private void createTimeLog(Project project, String issueKey, User user, BigDecimal hours,
                               LocalDate logDate, String description) {
        List<Issue> issues = issueRepository.findByProjectId(project.getId(), org.springframework.data.domain.PageRequest.of(0, 100))
                .stream().filter(i -> i.getIssueKey().equals(issueKey)).toList();
        if (issues.isEmpty()) return;
        Issue issue = issues.get(0);

        TimeLog log = new TimeLog();
        log.setIssue(issue);
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
}