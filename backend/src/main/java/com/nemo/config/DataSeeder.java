package com.nemo.config;

import com.nemo.client.Client;
import com.nemo.client.ClientContact;
import com.nemo.client.ClientContactRepository;
import com.nemo.client.ClientRepository;
import com.nemo.company.Company;
import com.nemo.company.CompanyRepository;
import com.nemo.asset.Asset;
import com.nemo.asset.AssetRepository;
import com.nemo.bankaccount.BankAccount;
import com.nemo.bankaccount.BankAccountRepository;
import com.nemo.banktransaction.BankTransaction;
import com.nemo.banktransaction.BankTransactionRepository;
import com.nemo.bankstatement.BankStatementRepository;
import com.nemo.documentation.WikiPage;
import com.nemo.documentation.WikiPageRepository;
import com.nemo.task.Task;
import com.nemo.task.TaskRepository;
import com.nemo.leave.LeaveEntitlement;
import com.nemo.leave.LeaveEntitlementRepository;
import com.nemo.leave.LeaveRequest;
import com.nemo.leave.LeaveRequestRepository;
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
import com.nemo.expense.ProjectExpense;
import com.nemo.expense.ProjectExpense.ExpenseCategory;
import com.nemo.expense.ProjectExpenseRepository;
import com.nemo.payment.ProjectPayment;
import com.nemo.payment.ProjectPaymentRepository;
import com.nemo.presale.PreSale;
import com.nemo.presale.PreSale.PreSaleStage;
import com.nemo.presale.PreSaleRepository;
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

// ACCESS CONTROL EXPECTATIONS (for PM-Agent testing)
// admin     (ADMIN)       → CAN access all routes including /admin
// majid    (MANAGER)     → CAN access /reports; CANNOT access /admin
// ismail   (CONTRIBUTOR) → MUST NOT access /reports, /pmo, /admin
// hanane   (CONTRIBUTOR) → MUST NOT access /reports, /pmo, /admin
// wadii    (CONTRIBUTOR) → MUST NOT access /reports, /pmo, /admin
// ahmed    (CONTRIBUTOR) → MUST NOT access /reports, /pmo, /admin
// karima   (MANAGER)     → CAN access /reports; CANNOT access /admin
// salim    (EXECUTIVE)  → CAN access /reports cross-company; CANNOT access /admin
// basma    (EXTERNAL)    → MUST NOT access /reports, /pmo, /admin; sees only FSE and Mobile App
// younes   (CONTRIBUTOR) → MUST NOT access /reports, /pmo, /admin
// youssef  (MANAGER)     → CAN access /reports; CANNOT access /admin
// walid    (CONTRIBUTOR) → MUST NOT access /reports, /pmo, /admin
// mehdi    (HR)          → CAN access /reports; CANNOT access /admin

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
    private final ClientContactRepository clientContactRepository;
    private final LeaveEntitlementRepository leaveEntitlementRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final ProjectExpenseRepository projectExpenseRepository;
    private final PreSaleRepository preSaleRepository;
    private final ProjectPaymentRepository projectPaymentRepository;
    private final BankAccountRepository bankAccountRepository;
    private final BankTransactionRepository bankTransactionRepository;
    private final BankStatementRepository bankStatementRepository;

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
                      ClientRepository clientRepository,
                      ClientContactRepository clientContactRepository,
                      LeaveEntitlementRepository leaveEntitlementRepository,
                      LeaveRequestRepository leaveRequestRepository,
                      ProjectExpenseRepository projectExpenseRepository,
                      PreSaleRepository preSaleRepository,
                      ProjectPaymentRepository projectPaymentRepository,
                      BankAccountRepository bankAccountRepository,
                      BankTransactionRepository bankTransactionRepository,
                      BankStatementRepository bankStatementRepository) {
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
        this.clientContactRepository = clientContactRepository;
        this.leaveEntitlementRepository = leaveEntitlementRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.projectExpenseRepository = projectExpenseRepository;
        this.preSaleRepository = preSaleRepository;
        this.projectPaymentRepository = projectPaymentRepository;
        this.bankAccountRepository = bankAccountRepository;
        this.bankTransactionRepository = bankTransactionRepository;
        this.bankStatementRepository = bankStatementRepository;
    }

    // --- Seeding profile records ---

    private record SeedingProfile(
            String groupName, String currency,
            String[] companyNames, String[] companyKeys, String[] companyDescriptions,
            String[] companyAddresses, String[] companyWebsites, String[] companyDomains,
            String[] userUsernames, String[] userFirstNames, String[] userLastNames,
            String[] userEmails, String[] userPhones,
            String[] userJobTitles, String[] userDepartments,
            String[] clientNames, String[] clientIndustries,
            String[][] locationNames, String[][] locationDescriptions,
            List<HolidayData> holidays,
            String[] preSaleNames, String[] preSaleKeys, String[] preSaleDescriptions, BigDecimal[] preSaleValues,
            String[][] contactNames, String[][] contactRoles, String[][] contactEmails, String[][] contactPhones
    ) {}

    private record HolidayData(LocalDate date, String name) {}

    private static SeedingProfile devProfile(int year) {
        return new SeedingProfile(
                "SIGroup", "USD",
                new String[]{"Sione", "Partion", "Sportfull", "Medocode"},
                new String[]{"SIO", "PAR", "SPO", "MDC"},
                new String[]{"Digital innovation and technology solutions",
                        "Consulting and organizational development",
                        "Team collaboration and productivity tools",
                        "Healthcare ERP solutions and medical information systems"},
                new String[]{"45 Innovation Drive, San Francisco",
                        "78 Tech Boulevard, Austin",
                        "12 Market Street, New York",
                        "33 Commerce Ave, London"},
                new String[]{"http://www.sione.io", "http://www.partion.io",
                        "http://www.sportfull.io", "http://www.medocode.io"},
                new String[]{"sione.io", "partion.io", "sportfull.io", "medocode.io"},
                new String[]{"admin", "jordan", "taylor", "morgan", "casey",
                        "riley", "drew", "avery", "quinn", "blake",
                        "reese", "jamie", "sam", "alex"},
                new String[]{"Alex", "Jordan", "Taylor", "Morgan", "Casey",
                        "Riley", "Drew", "Avery", "Quinn", "Blake",
                        "Reese", "Jamie", "Sam", "Alex"},
                new String[]{"Johnson", "Williams", "Chen", "Patel", "Smith",
                        "Garcia", "Kim", "Muller", "Brown", "Davis",
                        "Wilson", "Lee", "Taylor", "Turner"},
                new String[]{"admin@sione.io", "jordan@sione.io", "taylor@sione.io", "morgan@sione.io",
                        "casey@partion.io", "riley@partion.io", "drew@partion.io", "avery@sione.io",
                        "quinn@medocode.io", "blake@sportfull.io", "reese@sportfull.io", "jamie@sione.io",
                        "sam@sione.io", "alex@sione.io"},
                new String[]{"+1 (555) 100-0001", "+1 (555) 100-0002", "+1 (555) 100-0003", "+1 (555) 100-0004",
                        "+1 (555) 200-0005", "+1 (555) 200-0006", "+1 (555) 200-0007", "+1 (555) 100-0008",
                        null, "+1 (555) 400-0010", "+1 (555) 300-0011", "+1 (555) 300-0012",
                        "+1 (555) 100-0013", "+1 (555) 100-0014"},
                new String[]{"System Administrator", "Project Manager", "Senior Developer", "Frontend Developer",
                        "Backend Developer", "Full-Stack Developer", "Delivery Manager", "CEO",
                        "Consultant", "DevOps Engineer", "Team Lead", "QA Engineer", "HR Director",
                        "Finance Director"},
                new String[]{"IT", "Engineering", "Engineering", "Engineering",
                        "Engineering", "Engineering", "Operations", "Executive",
                        null, "Infrastructure", "Engineering", "Quality", "Human Resources",
                        "Finance"},
                new String[]{"GlobalTech Corp", "Sportify Inc", "TeleConnect",
                        "HealthFirst", "IndusCo"},
                new String[]{"Technology", "Sports", "Telecommunications",
                        "Healthcare", "Industrial"},
                new String[][]{
                        {"Sione HQ", "Sione Innovation Campus"},
                        {"Partion Office", "Partion Downtown"},
                        {"Sportfull Workspace",},
                        {"Medocode Lab"}
                },
                new String[][]{
                        {"Main office", "Secondary office"},
                        {"Headquarters", "Branch office"},
                        {"Office",},
                        {"Office"}
                },
                // International holidays (US-observed)
                List.of(
                        new HolidayData(LocalDate.of(year, 1, 1), "New Year's Day"),
                        new HolidayData(LocalDate.of(year, 1, 20), "Martin Luther King Jr. Day"),
                        new HolidayData(LocalDate.of(year, 2, 17), "Presidents' Day"),
                        new HolidayData(computeGoodFriday(year), "Good Friday"),
                        new HolidayData(computeEasterMonday(year), "Easter Monday"),
                        new HolidayData(LocalDate.of(year, 5, 26), "Memorial Day"),
                        new HolidayData(LocalDate.of(year, 7, 4), "Independence Day"),
                        new HolidayData(LocalDate.of(year, 9, 1), "Labour Day"),
                        new HolidayData(LocalDate.of(year, 11, 27), "Thanksgiving"),
                        new HolidayData(LocalDate.of(year, 12, 25), "Christmas Day")
                ),
                // Pre-sale opportunities
                new String[]{"Cloud Migration RFP", "HR System Upgrade", "Mobile App MVP", "Data Analytics Platform"},
                new String[]{"CM-RFP", "HR-UPG", "MA-MVP", "DA-PLT"},
                new String[]{"Enterprise cloud migration and infrastructure modernization",
                        "Human resources management system upgrade and integration",
                        "Cross-platform mobile application minimum viable product",
                        "Enterprise data warehouse and business intelligence platform"},
                new BigDecimal[]{new BigDecimal("120000"), new BigDecimal("45000"),
                        new BigDecimal("80000"), new BigDecimal("200000")},
                // Client contacts (2 per client)
                new String[][]{
                        {"Alice Thompson", "Robert Hayes"},
                        {"Linda Martinez", "David Chen"},
                        {"Sarah Johnson", "Michael Brown"},
                        {"Emma Wilson", "James Taylor"},
                        {"Patricia Lee", "Daniel Anderson"}
                },
                new String[][]{
                        {"CTO", "Project Sponsor"},
                        {"VP Engineering", "Product Owner"},
                        {"Operations Director", "Technical Lead"},
                        {"Medical Director", "IT Manager"},
                        {"Plant Manager", "Procurement Lead"}
                },
                new String[][]{
                        {"alice@globaltech.io", "robert@globaltech.io"},
                        {"linda@sportify.io", "david@sportify.io"},
                        {"sarah@teleconnect.io", "michael@teleconnect.io"},
                        {"emma@healthfirst.io", "james@healthfirst.io"},
                        {"patricia@indusco.io", "daniel@indusco.io"}
                },
                new String[][]{
                        {"+1 (555) 600-0001", "+1 (555) 600-0002"},
                        {"+1 (555) 600-0003", "+1 (555) 600-0004"},
                        {"+1 (555) 600-0005", "+1 (555) 600-0006"},
                        {"+1 (555) 600-0007", "+1 (555) 600-0008"},
                        {"+1 (555) 600-0009", "+1 (555) 600-0010"}
                }
        );
    }

    private static SeedingProfile demoProfile(int year) {
        return new SeedingProfile(
                "Netopia Group", "DH",
                new String[]{"Netopia", "Harmony", "MyTeam", "medERP"},
                new String[]{"NTO", "HRM", "MTM", "MER"},
                new String[]{"Digital innovation and technology solutions",
                        "Consulting and organizational development",
                        "Team collaboration and productivity tools",
                        "Healthcare ERP solutions and medical information systems"},
                new String[]{"Imb hightech, av Ennakhil, Hay Riad, Rabat",
                        "14 Rue Annasim, Hay Riad, Rabat",
                        "Imb 5, Bouskoura, Casablanca",
                        "601, technopark, Rabat"},
                new String[]{"http://www.netopia.ma", "http://www.harmony.ma",
                        "http://www.myteam.ma", "http://www.mederp.ma"},
                new String[]{"netopia.ma", "harmony.ma", "myteam.ma", "mederp.net"},
                new String[]{"admin", "majid", "ismail", "hanane", "wadii",
                        "ahmed", "karima", "salim", "basma", "younes",
                        "youssef", "walid", "mehdi", "alex"},
                new String[]{"Admin", "Majid", "Ismail", "Hanane", "Wadii", "Ahmed",
                        "Karima", "Salim", "Basma", "Younes", "Youssef",
                        "Walid", "Mehdi", "Alex"},
                new String[]{"User", "Hassan", "Baraka", "Machkour", "Mokhtari", "Azouzi",
                        "Chari", "Rachidi", "Tayeb", "Alami", "Bennani",
                        "El Idrissi", "El Amrani", "Tazi"},
                new String[]{"admin@netopia.ma", "majid@netopia.ma", "ismail@netopia.ma", "hanane@netopia.ma",
                        "wadii@harmony.ma", "ahmed@harmony.ma", "karima@harmony.ma", "salim@netopia.ma",
                        "basma@netopia.ma", "younes@mederp.net", "youssef@myteam.ma", "walid@myteam.ma",
                        "mehdi@netopia.ma", "alex@netopia.ma"},
                new String[]{"+212 600 000 001", "+212 600 000 002", "+212 600 000 003", "+212 600 000 004",
                        "+212 600 000 005", "+212 600 000 006", "+212 600 000 007", "+212 600 000 008",
                        "+212 600 000 009", "+212 600 000 010", "+212 600 000 011", "+212 600 000 012",
                        "+212 600 000 013", "+212 600 000 014"},
                new String[]{"System Administrator", "Project Manager", "Senior Developer", "Frontend Developer",
                        "Backend Developer", "Full-Stack Developer", "Delivery Manager", "CEO",
                        "Consultant", "DevOps Engineer", "Team Lead", "QA Engineer", "HR Director",
                        "Finance Director"},
                new String[]{"IT", "Engineering", "Engineering", "Engineering",
                        "Engineering", "Engineering", "Operations", "Executive",
                        null, "Infrastructure", "Engineering", "Quality", "Human Resources",
                        "Finance"},
                new String[]{"CNSS", "FRMF", "IAM", "MSPS", "M INDS"},
                new String[]{"Government", "Sports", "Telecommunications",
                        "Government", "Industrial"},
                new String[][]{
                        {"Plateau 19 Imb Hightech", "Camelias"},
                        {"Villa Annasim", "Centre Al Kassous"},
                        {"Plateau Bouskoura"},
                        {"Bureau technoparc"}
                },
                new String[][]{
                        {"Main office at Hay Riad", "Secondary office"},
                        {"Main office", "Branch office"},
                        {"Office"},
                        {"Office"}
                },
                // Moroccan + Islamic holidays
                List.of(
                        new HolidayData(LocalDate.of(year, 1, 1), "New Year's Day"),
                        new HolidayData(LocalDate.of(year, 1, 11), "Independence Manifesto Day"),
                        new HolidayData(LocalDate.of(year, 3, 20), "Eid al-Fitr"),
                        new HolidayData(LocalDate.of(year, 5, 1), "Labour Day"),
                        new HolidayData(LocalDate.of(year, 5, 27), "Eid al-Adha"),
                        new HolidayData(LocalDate.of(year, 7, 30), "Throne Day"),
                        new HolidayData(LocalDate.of(year, 8, 14), "Oued Ed-Dahab Day"),
                        new HolidayData(LocalDate.of(year, 8, 20), "Revolution Day"),
                        new HolidayData(LocalDate.of(year, 8, 21), "Youth Day"),
                        new HolidayData(LocalDate.of(year, 11, 6), "Green March Day"),
                        new HolidayData(LocalDate.of(year, 11, 18), "Independence Day")
                ),
                // Pre-sale opportunities
                new String[]{"Migration Cloud RFP", "Mise à jour Système RH", "Application Mobile MVP", "Plateforme Analyse Données"},
                new String[]{"MC-RFP", "MAJ-RH", "AM-MVP", "PA-DON"},
                new String[]{"Migration cloud enterprise et modernisation infrastructure",
                        "Mise à niveau et intégration du système de gestion des ressources humaines",
                        "Produit minimum viable application mobile multiplateforme",
                        "Plateforme entreposage de données et intelligence d'affaires"},
                new BigDecimal[]{new BigDecimal("120000"), new BigDecimal("45000"),
                        new BigDecimal("80000"), new BigDecimal("200000")},
                // Client contacts (2 per client, French names for demo)
                new String[][]{
                        {"Amina Benali", "Karim Tazi"},
                        {"Fatima Zahra Alaoui", "Youssef Berrada"},
                        {"Hassan El Fassi", "Nadia Benmoussa"},
                        {"Dr. Khadija Amrani", "Omar Tabyaoui"},
                        {"Rachid Mouline", "Leila Chaoui"}
                },
                new String[][]{
                        {"Directrice Technique", "Responsable Projet"},
                        {"VP Engineering", "Product Owner"},
                        {"Directeur Opérations", "Responsable Technique"},
                        {"Directrice Médicale", "Responsable Informatique"},
                        {"Directeur Usine", "Responsable Achats"}
                },
                new String[][]{
                        {"amina@cnss.ma", "karim@cnss.ma"},
                        {"fatima@frmf.ma", "youssef@frmf.ma"},
                        {"hassan@iam.ma", "nadia@iam.ma"},
                        {"khadija@sps.ma", "omar@sps.ma"},
                        {"rachid@mines.ma", "leila@mines.ma"}
                },
                new String[][]{
                        {"+212 600 700 001", "+212 600 700 002"},
                        {"+212 600 700 003", "+212 600 700 004"},
                        {"+212 600 700 005", "+212 600 700 006"},
                        {"+212 600 700 007", "+212 600 700 008"},
                        {"+212 600 700 009", "+212 600 700 010"}
                }
        );
    }

    // Easter computation (Anonymous Gregorian algorithm)
    private static LocalDate computeEasterMonday(int year) {
        return computeEaster(year).plusDays(1);
    }

    private static LocalDate computeGoodFriday(int year) {
        return computeEaster(year).minusDays(2);
    }

    private static LocalDate computeEaster(int year) {
        int a = year % 19;
        int b = year / 100;
        int c = year % 100;
        int d = b / 4;
        int e = b % 4;
        int f = (b + 8) / 25;
        int g = (b - f + 1) / 3;
        int h = (19 * a + b - d - g + 15) % 30;
        int i = c / 4;
        int k = c % 4;
        int l = (32 + 2 * e + 2 * i - h - k) % 7;
        int m = (a + 11 * h + 22 * l) / 451;
        int month = (h + l - 7 * m + 114) / 31;
        int day = ((h + l - 7 * m + 114) % 31) + 1;
        return LocalDate.of(year, month, day);
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 1) return;
        if ("prod".equals(mode)) return;

        LocalDate today = LocalDate.now();
        int year = today.getYear();
        SeedingProfile p = "dev".equals(mode) ? devProfile(year) : demoProfile(year);

        // Companies
        String c1Logo = "https://mederp.net/downloads/nemo/" + p.companyNames()[0].toLowerCase() + ".jpg";
        String c2Logo = "https://mederp.net/downloads/nemo/" + p.companyNames()[1].toLowerCase() + ".jpg";
        String c3Logo = "https://mederp.net/downloads/nemo/" + p.companyNames()[2].toLowerCase() + ".jpg";
        String c4Logo = "https://mederp.net/downloads/nemo/" + p.companyNames()[3].toLowerCase() + ".jpg";

        Company company1 = createCompany(p.companyNames()[0], p.companyKeys()[0], p.companyDescriptions()[0],
                p.companyAddresses()[0], p.companyWebsites()[0], c1Logo, 1);
        Company company2 = createCompany(p.companyNames()[1], p.companyKeys()[1], p.companyDescriptions()[1],
                p.companyAddresses()[1], p.companyWebsites()[1], c2Logo, 2);
        Company company3 = createCompany(p.companyNames()[2], p.companyKeys()[2], p.companyDescriptions()[2],
                p.companyAddresses()[2], p.companyWebsites()[2], c3Logo, 3);
        Company company4 = createCompany(p.companyNames()[3], p.companyKeys()[3], p.companyDescriptions()[3],
                p.companyAddresses()[3], p.companyWebsites()[3], c4Logo, 4);

        // Organization config (global only)
        createOrgConfig(p.groupName(), null,
                p.companyAddresses()[0], p.companyWebsites()[0],
                "https://mederp.net/downloads/nemo/" + p.groupName().split(" ")[0].toLowerCase() + ".jpg",
                p.currency());

        // Users
        User admin = createUser(p.userUsernames()[0], p.userEmails()[0], p.userFirstNames()[0], p.userLastNames()[0], User.Role.ADMIN, null,
                p.userJobTitles()[0], p.userDepartments()[0], p.userPhones()[0], today.minusYears(3).plusMonths(2));
        User majid = createUser(p.userUsernames()[1], p.userEmails()[1], p.userFirstNames()[1], p.userLastNames()[1], User.Role.MANAGER, company1,
                p.userJobTitles()[1], p.userDepartments()[1], p.userPhones()[1], today.minusYears(3).plusMonths(3));
        User dev1 = createUser(p.userUsernames()[2], p.userEmails()[2], p.userFirstNames()[2], p.userLastNames()[2], User.Role.CONTRIBUTOR, company1,
                p.userJobTitles()[2], p.userDepartments()[2], p.userPhones()[2], today.minusYears(3));
        User dev2 = createUser(p.userUsernames()[3], p.userEmails()[3], p.userFirstNames()[3], p.userLastNames()[3], User.Role.CONTRIBUTOR, company1,
                p.userJobTitles()[3], p.userDepartments()[3], p.userPhones()[3], today.minusYears(2).plusMonths(5));
        User dev3 = createUser(p.userUsernames()[4], p.userEmails()[4], p.userFirstNames()[4], p.userLastNames()[4], User.Role.CONTRIBUTOR, company2,
                p.userJobTitles()[4], p.userDepartments()[4], p.userPhones()[4], today.minusYears(2).plusMonths(3));
        User dev4 = createUser(p.userUsernames()[5], p.userEmails()[5], p.userFirstNames()[5], p.userLastNames()[5], User.Role.CONTRIBUTOR, company2,
                p.userJobTitles()[5], p.userDepartments()[5], p.userPhones()[5], today.minusYears(2).plusMonths(2));
        User pmHarmony = createUser(p.userUsernames()[6], p.userEmails()[6], p.userFirstNames()[6], p.userLastNames()[6], User.Role.MANAGER, company2,
                p.userJobTitles()[6], p.userDepartments()[6], p.userPhones()[6], today.minusYears(3).plusMonths(5));
        User salim = createUser(p.userUsernames()[7], p.userEmails()[7], p.userFirstNames()[7], p.userLastNames()[7], User.Role.EXECUTIVE, null,
                p.userJobTitles()[7], p.userDepartments()[7], p.userPhones()[7], today.minusYears(4).plusMonths(5));
        User basma = createUser(p.userUsernames()[8], p.userEmails()[8], p.userFirstNames()[8], p.userLastNames()[8], User.Role.EXTERNAL, null,
                p.userJobTitles()[8], p.userDepartments()[8], null, today.minusMonths(5));
        User younes = createUser(p.userUsernames()[9], p.userEmails()[9], p.userFirstNames()[9], p.userLastNames()[9], User.Role.CONTRIBUTOR, company4,
                p.userJobTitles()[9], p.userDepartments()[9], p.userPhones()[9], today.minusYears(2).minusMonths(1));
        User youssef = createUser(p.userUsernames()[10], p.userEmails()[10], p.userFirstNames()[10], p.userLastNames()[10], User.Role.MANAGER, company3,
                p.userJobTitles()[10], p.userDepartments()[10], p.userPhones()[10], today.minusYears(3).plusMonths(4));
        User walid = createUser(p.userUsernames()[11], p.userEmails()[11], p.userFirstNames()[11], p.userLastNames()[11], User.Role.CONTRIBUTOR, company3,
                p.userJobTitles()[11], p.userDepartments()[11], p.userPhones()[11], today.minusYears(2).plusMonths(1));
        User mehdi = createUser(p.userUsernames()[12], p.userEmails()[12], p.userFirstNames()[12], p.userLastNames()[12], User.Role.HR, null,
                p.userJobTitles()[12], p.userDepartments()[12], p.userPhones()[12], today.minusYears(4));
        User alex = createUser(p.userUsernames()[13], p.userEmails()[13], p.userFirstNames()[13], p.userLastNames()[13], User.Role.FINANCE, null,
                p.userJobTitles()[13], p.userDepartments()[13], p.userPhones()[13], today.minusYears(3).plusMonths(6));

        // User rates for EVM
        createUserRate(admin, new BigDecimal("75.00"), today.minusMonths(17));
        createUserRate(majid, new BigDecimal("90.00"), today.minusMonths(17));
        createUserRate(dev1, new BigDecimal("65.00"), today.minusMonths(17));
        createUserRate(dev2, new BigDecimal("70.00"), today.minusMonths(17));
        createUserRate(dev3, new BigDecimal("60.00"), today.minusMonths(17));
        createUserRate(dev4, new BigDecimal("55.00"), today.minusMonths(17));
        createUserRate(pmHarmony, new BigDecimal("85.00"), today.minusMonths(17));
        createUserRate(younes, new BigDecimal("70.00"), today.minusMonths(17));
        createUserRate(youssef, new BigDecimal("80.00"), today.minusMonths(17));
        createUserRate(walid, new BigDecimal("60.00"), today.minusMonths(17));
        createUserRate(mehdi, new BigDecimal("80.00"), today.minusMonths(17));
        createUserRate(basma, new BigDecimal("100.00"), today.minusMonths(5));
        createUserRate(alex, new BigDecimal("85.00"), today.minusMonths(17));

        // Programs
        Program ehealth = createProgram("eHealth", "EH", "Digital health transformation initiative", majid, company1);
        Program mobilePlatform = createProgram("Mobile Platform", "MOB", "Mobile app platform development", pmHarmony, company2);
        Program globalInit = createProgram("Global Initiative", "GI", "Cross-company strategic initiative", salim, null);
        Program erpProgram = createProgram(p.companyNames()[3], p.companyKeys()[3], "Healthcare ERP and medical information systems", salim, company4);

        // Clients
        Client client0 = createClient(p.clientNames()[0], p.clientIndustries()[0], company1);
        Client client1 = createClient(p.clientNames()[1], p.clientIndustries()[1], null);
        Client client2 = createClient(p.clientNames()[2], p.clientIndustries()[2], company2);
        Client client3 = createClient(p.clientNames()[3], p.clientIndustries()[3], company1);
        Client client4 = createClient(p.clientNames()[4], p.clientIndustries()[4], company2);

        // Client contacts
        Client[] clients = {client0, client1, client2, client3, client4};
        for (int i = 0; i < clients.length; i++) {
            for (int j = 0; j < p.contactNames()[i].length; j++) {
                clientContactRepository.save(new ClientContact(clients[i],
                        p.contactNames()[i][j], p.contactEmails()[i][j],
                        p.contactPhones()[i][j], p.contactRoles()[i][j]));
            }
        }

        // Projects with PMO fields
        Project fse = createProject("FSE", "FSE", "Full Stack Engineering platform",
                ehealth, majid, Project.Stage.EXECUTION, 8,
                new BigDecimal("500000"), new BigDecimal("500000"),
                today.minusMonths(5), today.plusMonths(4), company1);
        fse.setClient(client0); fse = projectRepository.save(fse);

        Project apiGateway = createProject("API Gateway", "AG", "Central API gateway and service mesh",
                ehealth, majid, Project.Stage.PLANNING, 6,
                new BigDecimal("80000"), new BigDecimal("80000"),
                today.minusMonths(2), today.plusMonths(19), company1);

        Project mobileApp = createProject("Mobile App", "MA", "Cross-platform mobile application",
                mobilePlatform, pmHarmony, Project.Stage.EXECUTION, 7,
                new BigDecimal("200000"), new BigDecimal("200000"),
                today.minusMonths(4), today.plusMonths(5), company2);
        mobileApp.setClient(client4); mobileApp = projectRepository.save(mobileApp);

        Project infraUpgrade = createProject("Infrastructure Upgrade", "IU", "Cloud infrastructure modernization",
                globalInit, salim, Project.Stage.INITIATION, 5,
                new BigDecimal("50000"), new BigDecimal("50000"),
                today.plusMonths(1), today.plusMonths(6), null);

        Project eHealthPortal = createProject("Patient Portal", "PP", "Patient-facing health information portal",
                ehealth, majid, Project.Stage.INITIATION, 6,
                new BigDecimal("95000"), new BigDecimal("95000"),
                today.plusMonths(2), today.plusMonths(22), company1);
        eHealthPortal.setClient(client3); eHealthPortal = projectRepository.save(eHealthPortal);

        Project mobilePay = createProject("Mobile Payments", "MP", "In-app payment and billing integration",
                mobilePlatform, pmHarmony, Project.Stage.PLANNING, 7,
                new BigDecimal("120000"), new BigDecimal("120000"),
                today.minusMonths(1), today.plusMonths(19), company2);
        mobilePay.setClient(client2); mobilePay = projectRepository.save(mobilePay);

        Project dataWarehouse = createProject("Data Warehouse", "DW", "Enterprise data warehouse and analytics platform",
                globalInit, salim, Project.Stage.PLANNING, 8,
                new BigDecimal("180000"), new BigDecimal("180000"),
                today.plusMonths(3), today.plusMonths(13), null);

        Project erpProject = createProject(p.companyNames()[3], p.companyKeys()[3], "Healthcare ERP platform for hospital and clinic management",
                erpProgram, younes, Project.Stage.EXECUTION, 7,
                new BigDecimal("250000"), new BigDecimal("250000"),
                today.minusMonths(5), today.plusMonths(7), company4);

        Project footballTeam = createProject("Football Team Manager", "FTM", "Football team management and player tracking platform",
                null, youssef, Project.Stage.CLOSING, 7,
                new BigDecimal("120000"), new BigDecimal("120000"),
                today.minusMonths(3), today.plusMonths(1), company3);
        footballTeam.setClient(client1); footballTeam = projectRepository.save(footballTeam);

        // Add members with allocations
        addMember(fse, majid, 40);
        addMember(fse, dev1, 30);
        addMember(fse, dev2, 60);
        addMember(apiGateway, dev1, 25);
        addMember(apiGateway, majid, 40);
        addMember(mobileApp, dev3, 40);
        addMember(mobileApp, dev4, 60);
        addMember(mobileApp, pmHarmony, 60);
        addMember(infraUpgrade, dev1, 20);
        addMember(infraUpgrade, dev3, 30);
        addMember(infraUpgrade, salim, 60);
        addMember(eHealthPortal, dev2, 40);
        addMember(eHealthPortal, majid, 20);
        addMember(mobilePay, dev3, 30);
        addMember(mobilePay, dev4, 40);
        addMember(mobilePay, pmHarmony, 40);
        addMember(dataWarehouse, dev1, 15);
        addMember(dataWarehouse, salim, 40);
        addMember(erpProject, younes, 100);
        addMember(footballTeam, youssef, 100);
        addMember(footballTeam, walid, 100);
        addMember(footballTeam, dev1, 10);

        basma.setAssignedProject(fse);
        userRepository.save(basma);
        addMember(fse, basma);
        addMember(mobileApp, basma);

        // Favorites
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
                today.minusMonths(7), today.minusMonths(6));
        fseInit.setPlannedAmount(new BigDecimal("75000"));
        phaseRepository.save(fseInit);
        createDeliverable("Project Charter", "Defines scope, objectives, and stakeholders", fseInit, DeliverableState.VALIDATED, today.minusMonths(6).plusDays(15));
        createDeliverable("Requirements Document", "Functional and non-functional requirements", fseInit, DeliverableState.VALIDATED, today.minusMonths(6));

        Phase fseExec = createPhase("Execution", "Core development and implementation", fse, 1,
                today.minusMonths(6).plusDays(1), today.plusMonths(1));
        fseExec.setPlannedAmount(new BigDecimal("350000"));
        phaseRepository.save(fseExec);
        createDeliverable("MVP Release", "Minimum viable product with core features", fseExec, DeliverableState.DELIVERED, today.minusMonths(3));
        createDeliverable("API Layer", "RESTful API endpoints for all modules", fseExec, DeliverableState.DELIVERED, today.minusMonths(2));
        createDeliverable("Integration Tests", "End-to-end test suite for all services", fseExec, DeliverableState.DRAFT, today.plusMonths(1));

        Phase fseClose = createPhase("Closing", "Project wrap-up and handover", fse, 2,
                today.plusMonths(2), today.plusMonths(3));
        fseClose.setPlannedAmount(new BigDecimal("75000"));
        phaseRepository.save(fseClose);
        createDeliverable("Final Documentation", "Complete project documentation package", fseClose, DeliverableState.DRAFT, today.plusMonths(2).plusDays(15));
        createDeliverable("Handover Report", "Lessons learned and operational guide", fseClose, DeliverableState.DRAFT, today.plusMonths(3));

        Phase mobilePlan = createPhase("Planning", "Design and architecture phase", mobileApp, 0,
                today.minusMonths(6), today.minusMonths(4).plusDays(14));
        mobilePlan.setPlannedAmount(new BigDecimal("50000"));
        phaseRepository.save(mobilePlan);
        createDeliverable("UX Wireframes", "Mobile app screen designs and user flows", mobilePlan, DeliverableState.VALIDATED, today.minusMonths(5));
        createDeliverable("Architecture Document", "Technical architecture and API contracts", mobilePlan, DeliverableState.VALIDATED, today.minusMonths(4).plusDays(14));

        Phase mobileExec = createPhase("Execution", "Mobile app development", mobileApp, 1,
                today.minusMonths(4).plusDays(15), today.plusMonths(2));
        mobileExec.setPlannedAmount(new BigDecimal("180000"));
        phaseRepository.save(mobileExec);
        createDeliverable("Alpha Build", "Core functionality with placeholder data", mobileExec, DeliverableState.DELIVERED, today.minusMonths(2));
        createDeliverable("Beta Build", "Feature-complete build for testing", mobileExec, DeliverableState.DRAFT, today.plusMonths(1));
        createDeliverable("App Store Submission", "Final build with App Store assets", mobileExec, DeliverableState.DRAFT, today.plusMonths(2));

        Phase apiPlan = createPhase("Planning", "API gateway design", apiGateway, 0,
                today.minusMonths(5), today.minusMonths(3));
        apiPlan.setPlannedAmount(new BigDecimal("30000"));
        phaseRepository.save(apiPlan);
        createDeliverable("API Specification", "OpenAPI spec for gateway endpoints", apiPlan, DeliverableState.VALIDATED, today.minusMonths(4).plusDays(15));
        createDeliverable("Security Audit Plan", "Security review checklist and tooling setup", apiPlan, DeliverableState.DRAFT, today.minusMonths(3));

        Phase apiExec = createPhase("Execution", "Gateway implementation", apiGateway, 1,
                today.minusMonths(3).plusDays(1), today.plusMonths(4));
        apiExec.setPlannedAmount(new BigDecimal("100000"));
        phaseRepository.save(apiExec);
        createDeliverable("Rate Limiter Module", "Configurable rate limiting per service", apiExec, DeliverableState.DRAFT, today.plusMonths(1));
        createDeliverable("Service Registry", "Dynamic service discovery and health checks", apiExec, DeliverableState.DRAFT, today.plusMonths(4));

        Phase erpInit = createPhase("Initiation", "Stakeholder alignment and scope", erpProject, 0,
                today.minusMonths(8), today.minusMonths(6));
        erpInit.setPlannedAmount(new BigDecimal("60000"));
        phaseRepository.save(erpInit);
        createDeliverable("Business Case", "ROI analysis and project justification", erpInit, DeliverableState.VALIDATED, today.minusMonths(7).plusDays(1));
        createDeliverable("Stakeholder Map", "Key stakeholders and communication plan", erpInit, DeliverableState.VALIDATED, today.minusMonths(6).plusDays(14));

        Phase erpExec = createPhase("Execution", "ERP module development", erpProject, 1,
                today.minusMonths(6).plusDays(1), today.plusMonths(2));
        erpExec.setPlannedAmount(new BigDecimal("250000"));
        phaseRepository.save(erpExec);
        createDeliverable("Patient Management Module", "Core patient record system", erpExec, DeliverableState.DELIVERED, today.minusMonths(1));
        createDeliverable("Billing Module", "Insurance and payment processing", erpExec, DeliverableState.DRAFT, today.plusMonths(2));

        Phase ftmExec = createPhase("Execution", "Core platform features", footballTeam, 0,
                today.minusMonths(5), today.plusMonths(1));
        ftmExec.setPlannedAmount(new BigDecimal("150000"));
        phaseRepository.save(ftmExec);
        createDeliverable("Player Database", "Player profiles, stats, and history", ftmExec, DeliverableState.DELIVERED, today.minusMonths(3).plusDays(15));
        createDeliverable("Match Engine", "Match scheduling and result tracking", ftmExec, DeliverableState.DRAFT, today.plusMonths(1));

        // Wiki pages with mermaid diagrams
        createWikiPage("Project Overview", "overview", fse, admin,
                "# FSE Project Overview\n\n## Objectives\n\nThe Full Stack Engineering platform aims to deliver a modern, scalable web application for enterprise customers.\n\n### Key Goals\n\n- **Performance**: Sub-200ms response times\n- **Security**: SOC2 compliance\n- **Scalability**: 10x traffic growth support\n\n## Architecture\n\n```mermaid\ngraph TD\n    Client[Web Client] --> LB[Load Balancer]\n    LB --> GW[API Gateway]\n    GW --> Auth[Auth Service]\n    GW --> Core[Core API]\n    GW --> Notify[Notification Service]\n    Core --> DB[(PostgreSQL)]\n    Core --> Cache[(Redis Cache)]\n    Notify --> Queue[RabbitMQ]\n```\n\n## Timeline\n\n```mermaid\ngantt\n    title FSE Project Timeline\n    dateFormat YYYY-MM-DD\n    section Initiation\n    Requirements gathering  :done, init1, " + year + "-01-15, " + year + "-02-15\n    section Execution\n    MVP Development        :active, exec1, " + year + "-02-16, " + year + "-08-31\n    section Closing\n    Handover & Docs        :closing, " + year + "-09-01, " + year + "-09-30\n```\n\n## Team Structure\n\n```mermaid\ngraph LR\n    PM[Majid - PM] --> Dev1[Ismail - Backend]\n    PM --> Dev2[Hanane - Frontend]\n    PM --> Admin[Admin - Oversight]\n```");

        createWikiPage("Technical Design", "technical-design", fse, dev1,
                "# Technical Design\n\n## System Architecture\n\n```mermaid\ngraph TB\n    subgraph Frontend\n        UI[React SPA]\n        Mobile[Mobile App]\n    end\n    subgraph Backend\n        API[REST API]\n        Auth[Auth Service]\n        Worker[Background Worker]\n    end\n    subgraph Data\n        PG[(PostgreSQL)]\n        Redis[(Redis)]\n        S3[Object Storage]\n    end\n    UI --> API\n    Mobile --> API\n    API --> Auth\n    API --> PG\n    API --> Redis\n    Worker --> PG\n    Worker --> S3\n```\n\n## Database Schema\n\n```mermaid\nerDiagram\n    USER ||--o{ TASK : creates\n    USER ||--o{ TIME_LOG : logs\n    PROJECT ||--o{ TASK : contains\n    PROJECT ||--o{ MEMBER : has\n    TASK ||--o{ TIME_LOG : tracks\n    PROJECT ||--o{ RAID_ITEM : manages\n```\n\n## API Endpoints\n\n| Method | Path | Description |\n|--------|------|------------- |\n| GET | /api/projects | List all projects |\n| POST | /api/projects | Create a project |\n| GET | /api/tasks | List all tasks |\n| POST | /api/time-logs | Log time |\n\n## Deployment Pipeline\n\n```mermaid\ngraph LR\n    Code[Code Push] --> CI[CI Build & Test]\n    CI --> Stage[Staging Deploy]\n    Stage --> Review[Code Review]\n    Review --> Prod[Production Deploy]\n```");

        createWikiPage("Getting Started", "getting-started", mobileApp, dev3,
                "# Getting Started\n\n## Setup\n\n1. Clone the repository\n2. Run `npm install`\n3. Configure environment variables\n4. Start with `npm run dev`\n\n## Development Workflow\n\n```mermaid\ngraph TD\n    A[Feature Branch] --> B[Local Testing]\n    B --> C[Pull Request]\n    C --> D[Code Review]\n    D --> |Approved| E[Merge to Main]\n    D --> |Changes Needed| A\n    E --> F[CI/CD Pipeline]\n    F --> G[Deploy to Staging]\n    G --> H[QA Testing]\n    H --> |Pass| I[Deploy to Production]\n    H --> |Fail| A\n```\n\n## Mobile App Architecture\n\n```mermaid\ngraph TD\n    App[React Native App] --> API[Backend API]\n    App --> Push[Push Notifications]\n    App --> Cache[Local Storage]\n    API --> DB[(Database)]\n    API --> Auth[OAuth Provider]\n```");

        String c4DisplayName = p.companyNames()[3];
        createWikiPage(c4DisplayName + " Roadmap", "roadmap", erpProject, younes,
                "# " + c4DisplayName + " Roadmap\n\n## " + year + " Milestones\n\n```mermaid\ngantt\n    title " + c4DisplayName + " " + year + " Roadmap\n    dateFormat YYYY-MM-DD\n    section Q1\n    Patient Management  :done, q1a, " + year + "-01-01, " + year + "-03-31\n    section Q2\n    Billing Module      :active, q2a, " + year + "-04-01, " + year + "-06-30\n    section Q3\n    Lab Integration     :q3a, " + year + "-07-01, " + year + "-09-30\n    section Q4\n    Pharmacy Module     :q4a, " + year + "-10-01, " + year + "-12-31\n```\n\n## Module Dependencies\n\n```mermaid\ngraph TD\n    Patient[Patient Module] --> Billing[Billing Module]\n    Patient --> Lab[Lab Integration]\n    Billing --> Insurance[Insurance Claims]\n    Lab --> Pharmacy[Pharmacy Module]\n    Insurance --> Reports[Reporting]\n```\n\n## Integration Points\n\n```mermaid\ngraph LR\n    HIS[Hospital Info System] --> API[" + c4DisplayName + " API]\n    LIS[Lab Info System] --> API\n    PIS[Pharmacy System] --> API\n    API --> DW[Data Warehouse]\n    API --> Portal[Patient Portal]\n```");

        createWikiPage("Project Charter", "project-charter", apiGateway, majid,
                "# API Gateway Project Charter\n\n## Scope\n\nCentral API gateway for service routing, rate limiting, and authentication.\n\n## Stakeholders\n\n```mermaid\ngraph TD\n    Sponsor[Salim - Executive Sponsor] --> PM[Majid - Project Manager]\n    PM --> Dev1[Ismail - Lead Developer]\n    PM --> Dev2[Wadii - Backend Developer]\n    PM --> QA[Admin - QA Lead]\n```\n\n## Risk Assessment\n\n```mermaid\nquadrantChart\n    title Risk Assessment\n    x-axis Low Impact --> High Impact\n    y-axis Low Probability --> High Probability\n    quadrant-1 High Impact Low Probability\n    quadrant-2 High Impact High Probability\n    quadrant-3 Low Impact Low Probability\n    quadrant-4 Low Impact High Probability\n    Vendor Lock-in: [0.3, 0.4]\n    Scalability: [0.8, 0.6]\n    Security Breach: [0.9, 0.3]\n    Team Turnover: [0.4, 0.5]\n```\n\n## Budget\n\n| Category | Amount (" + p.currency() + ") |\n|----------|-------------|\n| Development | 50,000 |\n| Infrastructure | 15,000 |\n| Testing | 10,000 |\n| Contingency | 5,000 |");

        // Additional RAID items for remaining projects
        createRaidItem(eHealthPortal, RaidItem.RaidType.RISK, "Patient data privacy",
                "HIPAA compliance requirements for patient health information",
                RaidItem.RaidStatus.OPEN, 4, 5, "Engage privacy consultant and implement data encryption",
                majid, today.plusMonths(2));

        createRaidItem(eHealthPortal, RaidItem.RaidType.ASSUMPTION, "Hospital IT will provide API access",
                "Assuming existing hospital systems expose HL7/FHIR APIs",
                RaidItem.RaidStatus.OPEN, null, null, null, null, null);

        createRaidItem(eHealthPortal, RaidItem.RaidType.ISSUE, "Sandbox environment downtime",
                "Staging server crashes daily causing blocked testing cycles",
                RaidItem.RaidStatus.OPEN, null, null, "Escalated to infra team, pending root cause analysis",
                dev1, today.plusWeeks(1));

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

        createRaidItem(dataWarehouse, RaidItem.RaidType.ISSUE, "ETL pipeline failures",
                "Nightly ETL jobs failing intermittently causing stale dashboards",
                RaidItem.RaidStatus.MITIGATING, null, null, "Added retry logic and alerting on job failures",
                dev2, today.plusWeeks(2));

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
                SprintStatus.ACTIVE, today.minusDays(20), today.plusDays(8));
        Sprint sprint2 = createSprint("Sprint 2", "FSE enhancements", fse,
                SprintStatus.PLANNING, today.plusDays(9), today.plusDays(22));
        Sprint sprintM1 = createSprint("Mobile Sprint 1", "Core mobile features", mobileApp,
                SprintStatus.ACTIVE, today.minusDays(15), today.plusDays(10));

        // Tasks for FSE
        TaskStatus todo = allStatuses.stream().filter(s -> s.getCategory() == TaskStatus.Category.TODO).findFirst().orElse(allStatuses.get(0));
        TaskStatus inProgress = allStatuses.stream().filter(s -> s.getCategory() == TaskStatus.Category.IN_PROGRESS).findFirst().orElse(allStatuses.get(1));
        TaskStatus done = allStatuses.stream().filter(s -> s.getCategory() == TaskStatus.Category.DONE).findFirst().orElse(allStatuses.get(2));
        TaskType dev = taskTypeRepository.findById(4L).orElse(null);
        TaskType mgmt = taskTypeRepository.findById(1L).orElse(null);
        TaskType test = taskTypeRepository.findById(6L).orElse(null);

        createTask("FSE-1", "User authentication flow", fse, done, Task.Priority.HIGH, dev, dev1, admin, sprint1, 0, today.minusMonths(2), fseExec);
        createTask("FSE-2", "Dashboard layout", fse, done, Task.Priority.HIGH, dev, dev2, admin, sprint1, 1, today.minusMonths(1).plusWeeks(1), fseExec);
        createTask("FSE-3", "Profile management", fse, done, Task.Priority.MEDIUM, dev, dev1, admin, sprint1, 2, today.plusMonths(1), fseExec);
        createTask("FSE-4", "Search functionality", fse, inProgress, Task.Priority.MEDIUM, dev, dev2, admin, sprint2, 3, today.plusMonths(2), fseExec);
        createTask("FSE-5", "Notification system", fse, todo, Task.Priority.LOW, dev, null, admin, sprint2, 4, today.plusMonths(3), fseExec);
        createTask("FSE-6", "Payment integration", fse, todo, Task.Priority.HIGH, dev, null, admin, null, 5, today.plusMonths(4), fseExec);
        createTask("FSE-7", "Analytics reporting", fse, todo, Task.Priority.MEDIUM, dev, null, majid, null, 6, null, fseClose);

        createTask("FSE-9", "API error handling", fse, done, Task.Priority.HIGH, dev, dev1, admin, sprint1, 8, today.plusMonths(2), fseExec);
        createTask("FSE-10", "Database migration scripts", fse, todo, Task.Priority.MEDIUM, dev, dev1, admin, sprint1, 9, today.plusMonths(3), fseExec);

        // Tasks for Mobile App
        createTask("MA-1", "Login screen", mobileApp, done, Task.Priority.HIGH, dev, dev3, pmHarmony, sprintM1, 0, today.minusMonths(1), mobileExec);
        createTask("MA-2", "Navigation framework", mobileApp, done, Task.Priority.HIGH, dev, dev4, pmHarmony, sprintM1, 1, today.minusWeeks(2), mobileExec);
        createTask("MA-3", "Push notifications", mobileApp, inProgress, Task.Priority.MEDIUM, dev, dev3, pmHarmony, sprintM1, 2, today.plusMonths(4), mobileExec);
        createTask("MA-4", "Offline mode", mobileApp, todo, Task.Priority.HIGH, dev, null, pmHarmony, null, 3, today.plusMonths(5), mobileExec);
        createTask("MA-5", "Camera integration", mobileApp, todo, Task.Priority.LOW, dev, null, pmHarmony, null, 4, null, null);

        // Tasks for API Gateway
        createTask("AG-1", "Rate limiting module", apiGateway, done, Task.Priority.HIGH, dev, dev1, majid, null, 0, today.plusMonths(13), apiExec);
        createTask("AG-2", "Service discovery", apiGateway, todo, Task.Priority.HIGH, dev, null, majid, null, 1, today.plusMonths(16), apiExec);
        createTask("AG-3", "Load balancer config", apiGateway, todo, Task.Priority.MEDIUM, dev, null, majid, null, 2, today.plusMonths(18), apiPlan);

        // Tasks for Data Warehouse
        createTask("DW-1", "Data model design", dataWarehouse, done, Task.Priority.HIGH, dev, dev1, salim, null, 0, today.plusMonths(5), null);
        createTask("DW-2", "ETL pipeline setup", dataWarehouse, inProgress, Task.Priority.HIGH, dev, dev1, salim, null, 1, today.plusMonths(10), null);
        createTask("DW-3", "Analytics dashboard", dataWarehouse, todo, Task.Priority.MEDIUM, dev, null, salim, null, 2, today.plusMonths(13), null);

        createTask("PP-1", "Patient portal UI design", eHealthPortal, inProgress, Task.Priority.HIGH, dev, dev2, majid, null, 0, today.plusMonths(7), null);

        createTask("MA-6", "Client UX review", mobileApp, todo, Task.Priority.MEDIUM, dev, basma, pmHarmony, null, 5, today.plusMonths(5), mobileExec);

        Task extTask = createTask("FSE-8", "Client feedback on login flow", fse, todo, Task.Priority.MEDIUM, dev, basma, basma, null, 7, today.plusMonths(3), fseExec);
        extTask.setExternal(true);
        taskRepository.save(extTask);

        createTask("MER-1", "Amelioration design", erpProject, inProgress, Task.Priority.HIGH, dev, younes, younes, null, 0, today.plusMonths(4), erpExec);
        createTask("MER-2", "Homologation FSE", erpProject, todo, Task.Priority.HIGH, dev, younes, younes, null, 1, today.plusMonths(7), erpExec);

        createTask("FTM-1", "Player registration module", footballTeam, done, Task.Priority.HIGH, dev, walid, youssef, null, 0, today.minusMonths(1), ftmExec);
        createTask("FTM-2", "Match scheduling system", footballTeam, done, Task.Priority.HIGH, dev, walid, youssef, null, 1, today.plusMonths(5), ftmExec);
        createTask("FTM-3", "Training session planner", footballTeam, done, Task.Priority.MEDIUM, dev, dev1, youssef, null, 2, today.plusMonths(6), ftmExec);
        createTask("FTM-4", "Player statistics dashboard", footballTeam, done, Task.Priority.HIGH, dev, null, youssef, null, 3, today.plusMonths(6).plusWeeks(2), ftmExec);
        createTask("FTM-5", "Team lineup builder", footballTeam, done, Task.Priority.MEDIUM, dev, null, youssef, null, 4, null, ftmExec);
        createTask("FTM-6", "Injury tracking", footballTeam, done, Task.Priority.MEDIUM, dev, null, youssef, null, 5, today.plusMonths(8), null);

        // Story points for tasks
        setStoryPoints(fse, "FSE-1", 5);
        setStoryPoints(fse, "FSE-2", 3);
        setStoryPoints(fse, "FSE-3", 8);
        setStoryPoints(fse, "FSE-4", 5);
        setStoryPoints(fse, "FSE-5", 3);
        setStoryPoints(fse, "FSE-6", 8);
        setStoryPoints(fse, "FSE-7", 13);
        setStoryPoints(fse, "FSE-9", 3);
        setStoryPoints(fse, "FSE-10", 5);
        setStoryPoints(mobileApp, "MA-1", 5);
        setStoryPoints(mobileApp, "MA-2", 3);
        setStoryPoints(mobileApp, "MA-3", 8);
        setStoryPoints(mobileApp, "MA-4", 13);
        setStoryPoints(apiGateway, "AG-1", 8);
        setStoryPoints(apiGateway, "AG-2", 5);
        setStoryPoints(dataWarehouse, "DW-1", 5);
        setStoryPoints(dataWarehouse, "DW-2", 8);
        setStoryPoints(erpProject, "MER-1", 8);
        setStoryPoints(erpProject, "MER-2", 13);
        setStoryPoints(footballTeam, "FTM-1", 5);
        setStoryPoints(footballTeam, "FTM-2", 8);
        setStoryPoints(footballTeam, "FTM-3", 3);
        setStoryPoints(footballTeam, "FTM-4", 5);

        // Labels
        createLabel(fse, "Frontend", "#3B82F6");
        createLabel(fse, "Backend", "#10B981");
        createLabel(fse, "Bug", "#EF4444");
        createLabel(mobileApp, "iOS", "#8B5CF6");
        createLabel(mobileApp, "Android", "#F59E0B");

        // Time logs
        String[] dev1Descriptions = {"Implementation", "Bug fixes and testing", "Code review", "Feature development", "Refactoring", "Unit tests", "Integration work", "Documentation", "Deployment prep", "Optimization"};
        for (int i = 10; i >= 3; i--) {
            createTimeLog(fse, "FSE-3", dev1, new BigDecimal("8"), today.minusDays(i), dev1Descriptions[10 - i] + " - profile management");
        }
        createTimeLog(fse, "FSE-1", dev1, new BigDecimal("8"), today.minusDays(10), "Auth flow - complete");
        for (int i = 9; i >= 4; i--) {
            createTimeLog(apiGateway, "AG-1", dev1, new BigDecimal("8"), today.minusDays(i), "Rate limiting work");
        }

        for (int i = 10; i >= 2; i--) {
            createTimeLog(fse, "FSE-4", dev2, new BigDecimal("8"), today.minusDays(i), "Search functionality work");
        }
        createTimeLog(fse, "FSE-2", dev2, new BigDecimal("8"), today.minusDays(10), "Dashboard layout - complete");

        createTimeLog(mobileApp, "MA-1", dev3, new BigDecimal("8"), today.minusDays(12), "Login screen - complete");
        for (int i = 10; i >= 4; i--) {
            createTimeLog(mobileApp, "MA-3", dev3, new BigDecimal("8"), today.minusDays(i), "Push notifications development");
        }

        createTimeLog(mobileApp, "MA-2", dev4, new BigDecimal("8"), today.minusDays(11), "Navigation - complete");
        for (int i = 10; i >= 3; i--) {
            createTimeLog(mobileApp, "MA-3", dev4, new BigDecimal("8"), today.minusDays(i), "Mobile UI development");
        }

        for (int i = 10; i >= 4; i--) {
            createTimeLog(erpProject, "MER-1", younes, new BigDecimal("8"), today.minusDays(i), "Design amelioration work");
        }

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

        createRaidItem(mobileApp, RaidItem.RaidType.ISSUE, "Push notification delays",
                "iOS push notifications arriving 5-10 minutes late in production",
                RaidItem.RaidStatus.OPEN, null, null, "Investigating APNs connection pooling",
                dev3, today.plusWeeks(1));

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

        // Project expenses
        createExpense(fse, ExpenseCategory.SOFTWARE, new BigDecimal("15000"), "Dev tools and cloud services", today.minusMonths(5), majid);
        createExpense(fse, ExpenseCategory.EXPERTISE, new BigDecimal("25000"), "External consultants — architecture review", today.minusMonths(4), majid);
        createExpense(fse, ExpenseCategory.INFRASTRUCTURE, new BigDecimal("10000"), "Server hardware upgrade", today.minusMonths(3), dev1);
        createExpense(fse, ExpenseCategory.TRAVEL, new BigDecimal("5000"), "Team offsite workshop", today.minusMonths(2), majid);

        createExpense(apiGateway, ExpenseCategory.SOFTWARE, new BigDecimal("2000"), "API management platform license", today.minusMonths(3), majid);
        createExpense(apiGateway, ExpenseCategory.INFRASTRUCTURE, new BigDecimal("1500"), "Load balancer provisioning", today.minusMonths(2), dev1);

        createExpense(mobileApp, ExpenseCategory.EQUIPMENT, new BigDecimal("8000"), "Test devices — iOS and Android", today.minusMonths(6), pmHarmony);
        createExpense(mobileApp, ExpenseCategory.SOFTWARE, new BigDecimal("12000"), "Cross-platform framework license", today.minusMonths(4), dev3);
        createExpense(mobileApp, ExpenseCategory.TRAVEL, new BigDecimal("5000"), "User testing travel", today.minusMonths(2), pmHarmony);

        createExpense(mobilePay, ExpenseCategory.EXPERTISE, new BigDecimal("3000"), "Payment gateway consulting", today.minusMonths(3), pmHarmony);
        createExpense(mobilePay, ExpenseCategory.SOFTWARE, new BigDecimal("2000"), "PCI compliance tools", today.minusMonths(2), dev3);

        createExpense(dataWarehouse, ExpenseCategory.INFRASTRUCTURE, new BigDecimal("6000"), "Data lake storage", today.minusMonths(2), salim);
        createExpense(dataWarehouse, ExpenseCategory.SOFTWARE, new BigDecimal("4000"), "ETL tooling license", today.minusMonths(1), salim);

        createExpense(erpProject, ExpenseCategory.EXPERTISE, new BigDecimal("15000"), "Healthcare domain consultants", today.minusMonths(8), younes);
        createExpense(erpProject, ExpenseCategory.SOFTWARE, new BigDecimal("10000"), "ERP platform licenses", today.minusMonths(5), younes);
        createExpense(erpProject, ExpenseCategory.TRAVEL, new BigDecimal("5000"), "Hospital site visits", today.minusMonths(3), younes);

        createExpense(footballTeam, ExpenseCategory.EQUIPMENT, new BigDecimal("20000"), "GPS tracking devices for players", today.minusMonths(5), youssef);
        createExpense(footballTeam, ExpenseCategory.SOFTWARE, new BigDecimal("30000"), "Platform development tools", today.minusMonths(4), youssef);
        createExpense(footballTeam, ExpenseCategory.TRAVEL, new BigDecimal("10000"), "Away match logistics", today.minusMonths(2), youssef);
        createExpense(footballTeam, ExpenseCategory.INFRASTRUCTURE, new BigDecimal("15000"), "Server hosting and CDN", today.minusMonths(1), youssef);
        createExpense(footballTeam, ExpenseCategory.EXPERTISE, new BigDecimal("25000"), "Sports analytics consultancy", today.minusMonths(6), youssef);

        // Bank accounts
        BankAccount mainOperating = null, savingsAcct = null, eurOperating = null, corporateAcct = null, primaryAcct = null;
        if (bankAccountRepository.count() == 0) {
            mainOperating = bankAccountRepository.save(new BankAccount(company1, "Main Operating Account", "MA12345678901234567890123456", "MAD", new BigDecimal("500000")));
            savingsAcct = bankAccountRepository.save(new BankAccount(company1, "Savings Account", "MA98765432109876543210987654", "MAD", new BigDecimal("2000000")));
            eurOperating = bankAccountRepository.save(new BankAccount(company2, "EUR Operating Account", "FR1420041010050500013M02606", "EUR", new BigDecimal("150000")));
            corporateAcct = bankAccountRepository.save(new BankAccount(company3, "Corporate Account", "NL91ABNA0417164300", "EUR", new BigDecimal("320000")));
            primaryAcct = bankAccountRepository.save(new BankAccount(company4, "Primary Account", "DE89370400440532013000", "EUR", new BigDecimal("80000")));
        }

        // Bank transactions
        if (bankTransactionRepository.count() == 0 && mainOperating != null) {
            createBankTransaction(mainOperating, today.minusMonths(3), "Client payment - FSE Phase 1", new BigDecimal("150000"), "MAD", "TRF-001");
            createBankTransaction(mainOperating, today.minusMonths(2), "Office rent", new BigDecimal("-25000"), "MAD", "DD-001");
            createBankTransaction(mainOperating, today.minusMonths(1), "API Gateway subscription", new BigDecimal("-15000"), "MAD", "DD-002");
            createBankTransaction(mainOperating, today.minusDays(15), "Client payment - Mobile App MVP", new BigDecimal("40000"), "MAD", "TRF-002");
            createBankTransaction(mainOperating, today.minusDays(5), "Payroll - January", new BigDecimal("-180000"), "MAD", "PAY-001");
            createBankTransaction(savingsAcct, today.minusMonths(6), "Quarterly interest", new BigDecimal("12500"), "MAD", "INT-001");
            createBankTransaction(savingsAcct, today.minusMonths(2), "Transfer from operating", new BigDecimal("500000"), "MAD", "TRF-003");
            createBankTransaction(eurOperating, today.minusMonths(4), "Client payment - Data Warehouse", new BigDecimal("55000"), "EUR", "TRF-EUR-001");
            createBankTransaction(eurOperating, today.minusMonths(2), "Cloud hosting - AWS", new BigDecimal("-8000"), "EUR", "DD-EUR-001");
            createBankTransaction(eurOperating, today.minusWeeks(1), "Consulting fees", new BigDecimal("-12000"), "EUR", "DD-EUR-002");
            createBankTransaction(corporateAcct, today.minusMonths(3), "License revenue", new BigDecimal("85000"), "EUR", "TRF-NL-001");
            createBankTransaction(corporateAcct, today.minusMonths(1), "Vendor payment - Software", new BigDecimal("-35000"), "EUR", "DD-NL-001");
            createBankTransaction(primaryAcct, today.minusMonths(2), "Project delivery payment", new BigDecimal("50000"), "EUR", "TRF-DE-001");
            createBankTransaction(primaryAcct, today.minusWeeks(2), "Office expenses", new BigDecimal("-5000"), "EUR", "DD-DE-001");
        }

        // Project payments
        createPayment(fse, "Project Kickoff Invoice", new BigDecimal("100000"), today.minusMonths(17), today.minusMonths(15), ProjectPayment.PaymentStatus.RECEIVED, alex);
        createPayment(fse, "Phase 1 Delivery", new BigDecimal("150000"), today.minusMonths(8), today.minusMonths(5), ProjectPayment.PaymentStatus.RECEIVED, alex);
        createPayment(fse, "Phase 2 Milestone", new BigDecimal("150000"), today.plusMonths(2), null, ProjectPayment.PaymentStatus.PENDING, alex);
        createPayment(fse, "Final Delivery", new BigDecimal("100000"), today.plusMonths(3), null, ProjectPayment.PaymentStatus.PENDING, alex);
        createPayment(apiGateway, "Setup Invoice", new BigDecimal("20000"), today.minusMonths(10), today.minusMonths(8), ProjectPayment.PaymentStatus.RECEIVED, alex);
        createPayment(apiGateway, "Gateway Subscription Q2", new BigDecimal("15000"), today.minusMonths(1), null, ProjectPayment.PaymentStatus.PENDING, alex);
        createPayment(mobileApp, "MVP Delivery", new BigDecimal("40000"), today.minusMonths(4), today.minusMonths(2), ProjectPayment.PaymentStatus.RECEIVED, alex);
        createPayment(mobileApp, "Feature Release", new BigDecimal("35000"), today.plusMonths(1), null, ProjectPayment.PaymentStatus.PENDING, alex);
        createPayment(infraUpgrade, "Infrastructure Phase 1", new BigDecimal("60000"), today.minusMonths(6), today.minusMonths(4), ProjectPayment.PaymentStatus.RECEIVED, alex);
        createPayment(infraUpgrade, "Cloud Migration", new BigDecimal("75000"), today.minusMonths(1), null, ProjectPayment.PaymentStatus.PENDING, alex);
        createPayment(eHealthPortal, "Portal Launch", new BigDecimal("80000"), today.minusMonths(3), today.minusMonths(1), ProjectPayment.PaymentStatus.RECEIVED, alex);
        createPayment(mobilePay, "Integration Payment", new BigDecimal("45000"), today.minusMonths(2), today.minusMonths(1), ProjectPayment.PaymentStatus.RECEIVED, alex);
        createPayment(mobilePay, "Security Audit Invoice", new BigDecimal("25000"), today.plusMonths(2), null, ProjectPayment.PaymentStatus.PENDING, alex);
        createPayment(dataWarehouse, "Analytics Platform", new BigDecimal("55000"), today.minusMonths(5), today.minusMonths(3), ProjectPayment.PaymentStatus.RECEIVED, alex);
        createPayment(dataWarehouse, "Data Pipeline", new BigDecimal("30000"), today.minusMonths(1), null, ProjectPayment.PaymentStatus.PENDING, alex);
        createPayment(erpProject, "ERP Module 1", new BigDecimal("120000"), today.minusMonths(10), today.minusMonths(7), ProjectPayment.PaymentStatus.RECEIVED, alex);
        createPayment(erpProject, "ERP Module 2", new BigDecimal("80000"), today.minusMonths(3), today.minusMonths(1), ProjectPayment.PaymentStatus.RECEIVED, alex);
        createPayment(erpProject, "Go-Live Invoice", new BigDecimal("50000"), today.plusMonths(1), null, ProjectPayment.PaymentStatus.PENDING, alex);
        createPayment(footballTeam, "Platform Build", new BigDecimal("70000"), today.minusMonths(7), today.minusMonths(5), ProjectPayment.PaymentStatus.RECEIVED, alex);
        createPayment(footballTeam, "Season License", new BigDecimal("25000"), today.minusMonths(1), null, ProjectPayment.PaymentStatus.PENDING, alex);

        // Public holidays
        for (HolidayData h : p.holidays()) {
            createHoliday(h.date(), h.name(), null);
        }

        // Locations
        Location loc1a = createLocation(p.locationNames()[0][0], p.companyNames()[0] + " " + p.locationDescriptions()[0][0], null, company1, 1);
        Location loc1b = createLocation(p.locationNames()[0][1], p.companyNames()[0] + " " + p.locationDescriptions()[0][1], null, company1, 2);
        Location loc2a = createLocation(p.locationNames()[1][0], p.companyNames()[1] + " " + p.locationDescriptions()[1][0], null, company2, 1);
        Location loc2b = createLocation(p.locationNames()[1][1], p.companyNames()[1] + " " + p.locationDescriptions()[1][1], null, company2, 2);
        Location loc3a = createLocation(p.locationNames()[2][0], p.companyNames()[2] + " " + p.locationDescriptions()[2][0], null, company3, 1);
        Location loc4a = createLocation(p.locationNames()[3][0], p.companyNames()[3] + " " + p.locationDescriptions()[3][0], null, company4, 1);

        // Assets
        createAsset("MacBook Pro 16\"", Asset.Type.COMPUTER, Asset.Status.ASSIGNED, loc1a, dev1, company1,
                "MBP-2024-001", LocalDate.of(year - 2, 1, 15), new BigDecimal("2400"));
        createAsset("Dell Latitude 5540", Asset.Type.COMPUTER, Asset.Status.ASSIGNED, loc1a, dev2, company1,
                "DL-5540-002", LocalDate.of(year - 2, 3, 1), new BigDecimal("1200"));
        createAsset("Dell PowerEdge R740", Asset.Type.SERVER, Asset.Status.IN_USE, loc1b, null, company1,
                "SRV-R740-001", LocalDate.of(year - 3, 6, 1), new BigDecimal("8500"));
        createAsset("HP ProLiant DL380", Asset.Type.SERVER, Asset.Status.IN_USE, loc1b, null, company1,
                "SRV-DL380-002", LocalDate.of(year - 3, 6, 1), new BigDecimal("7200"));
        createAsset("iPhone 15 Pro", Asset.Type.MOBILE, Asset.Status.ASSIGNED, null, majid, company1,
                "IPH-15PRO-001", LocalDate.of(year - 2, 2, 1), new BigDecimal("1100"));
        createAsset("Samsung Galaxy S24", Asset.Type.MOBILE, Asset.Status.IN_STOCK, null, null, company1,
                "SGS-S24-002", LocalDate.of(year - 2, 4, 1), new BigDecimal("900"));
        createAsset("Toyota Hilux", Asset.Type.VEHICLE, Asset.Status.IN_USE, null, dev3, company2,
                "VHC-HILUX-001", LocalDate.of(year - 4, 8, 1), new BigDecimal("35000"));
        createAsset("Samsung Microwave", Asset.Type.MICROWAVE, Asset.Status.IN_USE, loc2a, null, company2,
                "MCI-SAM-001", LocalDate.of(year - 3, 3, 1), new BigDecimal("150"));
        createAsset("ThinkPad X1 Carbon", Asset.Type.COMPUTER, Asset.Status.ASSIGNED, null, dev3, company2,
                "TP-X1C-001", LocalDate.of(year - 2, 1, 10), new BigDecimal("1800"));
        createAsset("MacBook Air M2", Asset.Type.COMPUTER, Asset.Status.ASSIGNED, null, dev4, company2,
                "MBA-M2-001", LocalDate.of(year - 2, 2, 15), new BigDecimal("1300"));
        createAsset("Dell Monitor 27\"", Asset.Type.OTHER, Asset.Status.IN_USE, loc1a, null, company1,
                "MON-DELL27-001", LocalDate.of(year - 2, 1, 20), new BigDecimal("350"));
        createAsset("Cisco Switch C9200", Asset.Type.OTHER, Asset.Status.IN_USE, loc1b, null, company1,
                "NET-CS9200-001", LocalDate.of(year - 3, 5, 1), new BigDecimal("2800"));
        createAsset("iPad Pro 12.9\"", Asset.Type.MOBILE, Asset.Status.MAINTENANCE, null, null, company3,
                "IPD-PRO-001", LocalDate.of(year - 3, 11, 1), new BigDecimal("1100"));
        createAsset("ThinkPad T14s", Asset.Type.COMPUTER, Asset.Status.ASSIGNED, null, walid, company3,
                "TP-T14S-001", LocalDate.of(year - 2, 3, 1), new BigDecimal("1400"));
        createAsset("Coffee Machine Jura", Asset.Type.OTHER, Asset.Status.IN_STOCK, null, null, company1,
                "BEV-JURA-001", LocalDate.of(year - 2, 5, 1), new BigDecimal("800"));

        // Pre-sale opportunities
        PreSaleStage[] psStages = {PreSaleStage.PROPOSAL, PreSaleStage.LEAD, PreSaleStage.NEGOTIATION, PreSaleStage.LEAD};
        Client[] psClients = {client0, client2, client4, client0};
        int[] psProbabilities = {60, 30, 75, 20};
        User[] psManagers = {majid, pmHarmony, pmHarmony, salim};
        Company[] psCompanies = {company1, company2, company2, null};
        Program[] psPrograms = {ehealth, mobilePlatform, mobilePlatform, globalInit};
        for (int i = 0; i < p.preSaleNames().length; i++) {
            createPreSale(p.preSaleNames()[i], p.preSaleKeys()[i], p.preSaleDescriptions()[i],
                    psStages[i], psClients[i], p.preSaleValues()[i], psProbabilities[i],
                    today.plusMonths(i * 2 + 1), psManagers[i], psCompanies[i], psPrograms[i]);
        }

        // Leave entitlements
        int currentYear = today.getYear();
        User[] allUsers = {admin, majid, dev1, dev2, dev3, dev4, pmHarmony, salim, basma, younes, youssef, walid, mehdi};
        for (User u : allUsers) {
            createLeaveEntitlement(u, LeaveRequest.Type.VACATION, currentYear, 20);
            createLeaveEntitlement(u, LeaveRequest.Type.SICK, currentYear, 10);
            createLeaveEntitlement(u, LeaveRequest.Type.PERSONAL, currentYear, 5);
            createLeaveEntitlement(u, LeaveRequest.Type.UNPAID, currentYear, 0);
        }

        // Sample approved leave requests
        LeaveRequest lr1 = new LeaveRequest();
        lr1.setUser(admin); lr1.setType(LeaveRequest.Type.VACATION); lr1.setStartDate(LocalDate.of(currentYear, 1, 15)); lr1.setEndDate(LocalDate.of(currentYear, 1, 17)); lr1.setStatus(LeaveRequest.Status.APPROVED); lr1.setReason("Winter break"); lr1.setApprover(majid);
        leaveRequestRepository.save(lr1);

        LeaveRequest lr2 = new LeaveRequest();
        lr2.setUser(dev1); lr2.setType(LeaveRequest.Type.SICK); lr2.setStartDate(LocalDate.of(currentYear, 5, 5)); lr2.setEndDate(LocalDate.of(currentYear, 5, 6)); lr2.setStatus(LeaveRequest.Status.APPROVED); lr2.setReason("Flu"); lr2.setApprover(majid);
        leaveRequestRepository.save(lr2);

        LeaveRequest lr3 = new LeaveRequest();
        lr3.setUser(dev2); lr3.setType(LeaveRequest.Type.PERSONAL); lr3.setStartDate(LocalDate.of(currentYear, 2, 14)); lr3.setEndDate(LocalDate.of(currentYear, 2, 14)); lr3.setStatus(LeaveRequest.Status.APPROVED); lr3.setReason("Valentine's Day"); lr3.setApprover(majid);
        leaveRequestRepository.save(lr3);

        LeaveRequest lr4 = new LeaveRequest();
        lr4.setUser(majid); lr4.setType(LeaveRequest.Type.VACATION); lr4.setStartDate(LocalDate.of(currentYear, 3, 3)); lr4.setEndDate(LocalDate.of(currentYear, 3, 7)); lr4.setStatus(LeaveRequest.Status.APPROVED); lr4.setReason("Family vacation"); lr4.setApprover(salim);
        leaveRequestRepository.save(lr4);

        LeaveRequest lr5 = new LeaveRequest();
        lr5.setUser(youssef); lr5.setType(LeaveRequest.Type.VACATION); lr5.setStartDate(LocalDate.of(currentYear, 6, 16)); lr5.setEndDate(LocalDate.of(currentYear, 6, 20)); lr5.setStatus(LeaveRequest.Status.PENDING); lr5.setReason("Summer vacation");
        leaveRequestRepository.save(lr5);
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

    private OrganizationConfig createOrgConfig(String name, Company company, String address, String website, String logo, String currency) {
        OrganizationConfig config = new OrganizationConfig();
        config.setName(name);
        config.setAddress(address);
        config.setWebsite(website);
        config.setLogo(logo);
        config.setCurrency(currency);
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

    private PreSale createPreSale(String name, String key, String description,
                                   PreSaleStage stage, Client client, BigDecimal estimatedValue,
                                   Integer probability, LocalDate expectedCloseDate, User manager,
                                   Company company, Program program) {
        PreSale ps = new PreSale();
        ps.setName(name);
        ps.setKey(key);
        ps.setDescription(description);
        ps.setStage(stage);
        ps.setClient(client);
        ps.setEstimatedValue(estimatedValue);
        ps.setProbability(probability);
        ps.setExpectedCloseDate(expectedCloseDate);
        ps.setManager(manager);
        ps.setCompany(company);
        ps.setProgram(program);
        return preSaleRepository.save(ps);
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
                                  BigDecimal plannedValue, BigDecimal budget,
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
        project.setTargetStartDate(targetStartDate);
        project.setTargetEndDate(targetEndDate);
        project.setCompany(company);
        return projectRepository.save(project);
    }

    private void addMember(Project project, User user) {
        projectMemberRepository.save(new ProjectMember(project, user));
    }

    private void addMember(Project project, User user, int allocation) {
        ProjectMember pm = new ProjectMember(project, user);
        pm.setAllocation(allocation);
        projectMemberRepository.save(pm);
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
                             Sprint sprint, int position, LocalDate dueDate, Phase phase) {
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
        task.setPhase(phase);
        return taskRepository.save(task);
    }

    private void setStoryPoints(Project project, String taskKey, int points) {
        taskRepository.findAll().stream()
                .filter(t -> t.getProject().getId().equals(project.getId()) && t.getTaskKey().equals(taskKey))
                .findFirst()
                .ifPresent(t -> { t.setStoryPoints(points); taskRepository.save(t); });
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

    private ProjectExpense createExpense(Project project, ExpenseCategory category, BigDecimal amount,
                                          String description, LocalDate expenseDate, User createdBy) {
        ProjectExpense expense = new ProjectExpense();
        expense.setProject(project);
        expense.setCategory(category);
        expense.setAmount(amount);
        expense.setDescription(description);
        expense.setExpenseDate(expenseDate);
        expense.setCreatedBy(createdBy);
        expense.setApprovalStatus(ProjectExpense.ApprovalStatus.APPROVED);
        return projectExpenseRepository.save(expense);
    }

    private BankTransaction createBankTransaction(BankAccount bankAccount, LocalDate date, String description,
                                                    BigDecimal amount, String currency, String reference) {
        BankTransaction tx = new BankTransaction();
        tx.setBankAccount(bankAccount);
        tx.setDate(date);
        tx.setDescription(description);
        tx.setAmount(amount);
        tx.setCurrency(currency);
        tx.setReference(reference);
        return bankTransactionRepository.save(tx);
    }

    private ProjectPayment createPayment(Project project, String title, BigDecimal amount,
                                         LocalDate dueDate, LocalDate receivedDate,
                                         ProjectPayment.PaymentStatus status, User createdBy) {
        ProjectPayment payment = new ProjectPayment();
        payment.setProject(project);
        payment.setTitle(title);
        payment.setAmount(amount);
        payment.setCurrency(project.getCompany() != null
                ? organizationConfigRepository.findByCompanyId(project.getCompany().getId())
                        .map(org -> org.getCurrency()).orElse("USD") : "USD");
        payment.setDueDate(dueDate);
        payment.setReceivedDate(receivedDate);
        payment.setStatus(status);
        payment.setCreatedBy(createdBy);
        return projectPaymentRepository.save(payment);
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

    private LeaveEntitlement createLeaveEntitlement(User user, LeaveRequest.Type type, int year, int totalDays) {
        LeaveEntitlement entitlement = new LeaveEntitlement();
        entitlement.setUser(user);
        entitlement.setType(type);
        entitlement.setYear(year);
        entitlement.setTotalDays(totalDays);
        return leaveEntitlementRepository.save(entitlement);
    }
}