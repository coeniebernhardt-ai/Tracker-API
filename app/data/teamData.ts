export interface KPI {
  id: string;
  name: string;
  type: 'individual' | 'team' | 'group';
  goal: string;
  target: string;
  measurement: string;
  tracking: string;
  currentValue?: number;
  targetValue: number;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  definition: string;
  responsibilities: string[];
  kpis: KPI[];
}

export const teamMembers: TeamMember[] = [
  {
    id: 'andreas',
    name: 'Andreas Groenewald',
    role: 'Support Technician',
    avatar: 'AG',
    definition: 'The Support Technician provides hands-on technical assistance and maintenance for digital access control systems. This role focuses on diagnosing and resolving hardware and software issues, supporting installations, and ensuring optimal system performance for clients and internal users. The Support Technician plays a key role in delivering reliable and responsive technical support. They provide frontline technical and administrative support for digital access control systems. This role ensures smooth operation of customer-facing platforms, assists with troubleshooting, and supports the technical team in delivering high-quality service and solutions. Success in this role requires a combination of technical proficiency, effective communication, and strong organizational skills.',
    responsibilities: [
      'Customer Support: Respond to technical queries from clients and users, providing guidance and resolving issues related to digital access platforms.',
      'System Monitoring: Assist in monitoring system performance, logging incidents, and escalating issues to the appropriate technical teams.',
      'Documentation & Reporting: Maintain accurate records of support requests, resolutions, and system updates; assist in preparing reports and user guides.',
      'Technical Assistance: Support the setup, configuration, and testing of access control devices and software.',
      'Training & Onboarding: Help new users onboard by providing basic training and support materials for digital access systems.',
      'Collaboration: Work closely with the Technical Solutions team to ensure timely and effective resolution of customer issues.',
      'Process Improvement: Identify recurring issues and suggest improvements to support processes and user experience.'
    ],
    kpis: [
      {
        id: 'tickets-handled',
        name: 'Number of Tickets Handled',
        type: 'individual',
        goal: 'Total number of tickets resolved by the technician. Based on percentage',
        target: '80% excluding dependencies',
        measurement: '(Tickets closed by Technician / Total tickets appointed to Technician) × 100',
        tracking: 'Google Sheets Ticket Management System',
        currentValue: 85,
        targetValue: 80
      },
      {
        id: 'project-completion',
        name: 'On-Time Project/Task Completion Rate',
        type: 'individual',
        goal: 'Percentage of assigned project tasks completed by the agreed deadline.',
        target: '≥ 95%',
        measurement: '(Total Projects Completed / Total Projects) × 100',
        tracking: 'Projects Tracked via ClickUp',
        currentValue: 92,
        targetValue: 95
      },
      {
        id: 'response-time',
        name: 'Average First Response Time',
        type: 'team',
        goal: 'Ensures timely acknowledgment of support tickets and builds customer trust',
        target: '≤ 1 hour during business hours = 100%',
        measurement: '(First Response Time for all emergency tickets / Total number of emergency tickets) × 100',
        tracking: 'Google Sheets Ticket Management System',
        currentValue: 100,
        targetValue: 100
      },
      {
        id: 'project-delivery',
        name: 'On-Time Project Delivery Rate',
        type: 'team',
        goal: 'Percentage of technical support-related projects (e.g., system configurations, installations, integrations) delivered on or before the agreed deadline.',
        target: '≥ 70% on-time delivery',
        measurement: '(Projects delivered on time / Total projects) × 100',
        tracking: 'ClickUp Management System',
        currentValue: 78,
        targetValue: 70
      },
      {
        id: 'engagement',
        name: 'Group Impact and Engagement',
        type: 'group',
        goal: 'To foster a professional, respectful, and collaborative work environment through consistent demonstration of positive workplace behavior and interpersonal conduct',
        target: 'Discretion of Solutions Manager & Executive Management Team',
        measurement: 'Bamboo Total Scores / (Total survey × 3)',
        tracking: 'Peer and management surveys rate 1-3 (Never, Sometimes, Most of the time)',
        currentValue: 2.7,
        targetValue: 3
      }
    ]
  },
  {
    id: 'cornett',
    name: 'Cornett van Niekerk',
    role: 'Support Consultant',
    avatar: 'CN',
    definition: 'The Support Consultant provides expert-level assistance and guidance to clients and internal teams regarding digital access control systems. This role focuses on resolving technical issues, optimizing system performance, and ensuring customer satisfaction through proactive support and tailored solutions. The Support Consultant acts as a trusted advisor, combining technical knowledge with strong communication and problem-solving skills.',
    responsibilities: [
      'Technical Support: Recognising and reporting issues with troubleshooting for software related to access control systems.',
      'Client Advisory: Offer consultative support to clients, helping them understand system capabilities and recommending best practices for implementation and usage.',
      'Documentation & Training: Create and maintain support documentation, user guides, and training materials; deliver training sessions to clients and internal teams.',
      'Issue Escalation: Collaborate with development and technical teams to escalate and resolve complex technical problems.',
      'Feedback & Improvement: Gather client feedback and contribute to product and service improvements based on recurring support themes.'
    ],
    kpis: [
      {
        id: 'tickets-handled',
        name: 'Number of Tickets Handled',
        type: 'individual',
        goal: 'Total number of tickets resolved by the technician. Based on percentage',
        target: '80% excluding dependencies',
        measurement: '(Tickets closed by Technician / Total tickets appointed to Technician) × 100',
        tracking: 'Google Sheets Ticket Management System',
        currentValue: 88,
        targetValue: 80
      },
      {
        id: 'project-completion',
        name: 'On-Time Project/Task Completion Rate',
        type: 'individual',
        goal: 'Percentage of assigned project tasks completed by the agreed deadline.',
        target: '≥ 95%',
        measurement: '(Total Projects Completed / Total Projects) × 100',
        tracking: 'Projects Tracked via ClickUp',
        currentValue: 97,
        targetValue: 95
      },
      {
        id: 'response-time',
        name: 'Average First Response Time',
        type: 'team',
        goal: 'Ensures timely acknowledgment of support tickets and builds customer trust',
        target: '≤ 1 hour during business hours = 100%',
        measurement: '(First Response Time for all emergency tickets / Total number of emergency tickets) × 100',
        tracking: 'Google Sheets Ticket Management System',
        currentValue: 100,
        targetValue: 100
      },
      {
        id: 'project-delivery',
        name: 'On-Time Project Delivery Rate',
        type: 'team',
        goal: 'Percentage of technical support-related projects (e.g., system configurations, installations, integrations) delivered on or before the agreed deadline.',
        target: '≥ 70% on-time delivery',
        measurement: '(Projects delivered on time / Total projects) × 100',
        tracking: 'ClickUp Management System',
        currentValue: 78,
        targetValue: 70
      },
      {
        id: 'engagement',
        name: 'Group Impact and Engagement',
        type: 'group',
        goal: 'To foster a professional, respectful, and collaborative work environment through consistent demonstration of positive workplace behavior and interpersonal conduct',
        target: 'Discretion of Solutions Manager & Executive Management Team',
        measurement: 'Bamboo Total Scores / (Total survey × 3)',
        tracking: 'Peer and management surveys rate 1-3 (Never, Sometimes, Most of the time)',
        currentValue: 2.8,
        targetValue: 3
      }
    ]
  },
  {
    id: 'lisandro',
    name: 'Lisandro Davis',
    role: 'Digital Project Manager',
    avatar: 'LD',
    definition: 'The Digital Project Manager provides hands-on technical assistance and maintenance for digital access control systems. This role focuses on diagnosing and resolving hardware and software issues, supporting installations, and ensuring optimal system performance for clients and internal users. The Digital Project Manager plays a key role in delivering reliable and responsive technical support. They provide frontline technical and administrative support for digital access control systems. This role ensures smooth operation of customer-facing platforms, assists with troubleshooting, and supports the technical team in delivering high-quality service and solutions. Success in this role requires a combination of technical proficiency, effective communication, and strong organizational skills.',
    responsibilities: [
      'Customer Support: Respond to technical queries from clients and users, providing guidance and resolving issues related to digital access platforms.',
      'System Monitoring: Assist in monitoring system performance, logging incidents, and escalating issues to the appropriate technical teams.',
      'Documentation & Reporting: Maintain accurate records of support requests, resolutions, and system updates; assist in preparing reports and user guides.',
      'Technical Assistance: Support the setup, configuration, and testing of access control devices and software.',
      'Training & Onboarding: Help new users onboard by providing basic training and support materials for digital access systems.',
      'Collaboration: Work closely with the Technical Solutions team to ensure timely and effective resolution of customer issues.',
      'Process Improvement: Identify recurring issues and suggest improvements to support processes and user experience.'
    ],
    kpis: [
      {
        id: 'tickets-handled',
        name: 'Number of Tickets Handled',
        type: 'individual',
        goal: 'Total number of tickets resolved by the technician. Based on percentage',
        target: '80% excluding dependencies',
        measurement: '(Tickets closed by Technician / Total tickets appointed to Technician) × 100',
        tracking: 'Google Sheets Ticket Management System',
        currentValue: 82,
        targetValue: 80
      },
      {
        id: 'project-completion',
        name: 'On-Time Project/Task Completion Rate',
        type: 'individual',
        goal: 'Percentage of assigned project tasks completed by the agreed deadline.',
        target: '≥ 95%',
        measurement: '(Total Projects Completed on Time / Total Projects) × 100',
        tracking: 'Projects Tracked via ClickUp',
        currentValue: 96,
        targetValue: 95
      },
      {
        id: 'response-time',
        name: 'Average First Response Time',
        type: 'team',
        goal: 'Ensures timely acknowledgment of support tickets and builds customer trust',
        target: '≤ 1 hour during business hours = 100%',
        measurement: '(First Response Time for all emergency tickets / Total number of emergency tickets) × 100',
        tracking: 'Google Sheets Ticket Management System',
        currentValue: 100,
        targetValue: 100
      },
      {
        id: 'project-delivery',
        name: 'On-Time Project Delivery Rate',
        type: 'team',
        goal: 'Percentage of technical support-related projects (e.g., system configurations, installations, integrations) delivered on or before the agreed deadline.',
        target: '≥ 70% on-time delivery',
        measurement: '(Projects delivered on time / Total projects) × 100',
        tracking: 'ClickUp Management System',
        currentValue: 78,
        targetValue: 70
      },
      {
        id: 'engagement',
        name: 'Group Impact and Engagement',
        type: 'group',
        goal: 'To foster a professional, respectful, and collaborative work environment through consistent demonstration of positive workplace behavior and interpersonal conduct',
        target: 'Discretion of Solutions Manager & Executive Management Team',
        measurement: 'Bamboo Total Scores / (Total survey × 3)',
        tracking: 'Peer and management surveys rate 1-3 (Never, Sometimes, Most of the time)',
        currentValue: 2.9,
        targetValue: 3
      }
    ]
  },
  {
    id: 'lucas',
    name: 'Lucas Bron',
    role: 'Digital Support Assistant',
    avatar: 'LB',
    definition: 'The Digital Support Assistant provides hands-on technical assistance and maintenance for digital access control systems. This role focuses on diagnosing and resolving hardware and software issues, supporting installations, and ensuring optimal system performance for clients and internal users. The Support Assistant plays a key role in delivering reliable and responsive technical support. They provide frontline technical and administrative support for digital access control systems. This role ensures smooth operation of customer-facing platforms, assists with troubleshooting, and supports the technical team in delivering high-quality service and solutions. Success in this role requires a combination of technical proficiency, effective communication, and strong organizational skills.',
    responsibilities: [
      'Customer Support: Respond to technical queries from clients and users, providing guidance and resolving issues related to digital access platforms.',
      'System Monitoring: Assist in monitoring system performance, logging incidents, and escalating issues to the appropriate technical teams.',
      'Documentation & Reporting: Maintain accurate records of support requests, resolutions, and system updates; assist in preparing reports and user guides.',
      'Technical Assistance: Support the setup, configuration, and testing of access control devices and software.',
      'Training & Onboarding: Help new users onboard by providing basic training and support materials for digital access systems.',
      'Collaboration: Work closely with the Technical Solutions team to ensure timely and effective resolution of customer issues.',
      'Process Improvement: Identify recurring issues and suggest improvements to support processes and user experience.'
    ],
    kpis: [
      {
        id: 'tickets-handled',
        name: 'Number of Tickets Handled',
        type: 'individual',
        goal: 'Total number of tickets resolved by the technician. Based on percentage',
        target: '80% excluding dependencies',
        measurement: '(Tickets closed by Technician / Total tickets appointed to Technician) × 100',
        tracking: 'Google Sheets Ticket Management System',
        currentValue: 79,
        targetValue: 80
      },
      {
        id: 'project-completion',
        name: 'On-Time Project/Task Completion Rate',
        type: 'individual',
        goal: 'Percentage of assigned project tasks completed by the agreed deadline.',
        target: '≥ 95%',
        measurement: '(Total Projects Completed / Total Projects) × 100',
        tracking: 'Projects Tracked via ClickUp',
        currentValue: 94,
        targetValue: 95
      },
      {
        id: 'response-time',
        name: 'Average First Response Time',
        type: 'team',
        goal: 'Ensures timely acknowledgment of support tickets and builds customer trust',
        target: '≤ 1 hour during business hours = 100%',
        measurement: '(First Response Time for all emergency tickets / Total number of emergency tickets) × 100',
        tracking: 'Google Sheets Ticket Management System',
        currentValue: 100,
        targetValue: 100
      },
      {
        id: 'project-delivery',
        name: 'On-Time Project Delivery Rate',
        type: 'team',
        goal: 'Percentage of technical support-related projects (e.g., system configurations, installations, integrations) delivered on or before the agreed deadline.',
        target: '≥ 70% on-time delivery',
        measurement: '(Projects delivered on time / Total projects) × 100',
        tracking: 'ClickUp Management System',
        currentValue: 78,
        targetValue: 70
      },
      {
        id: 'engagement',
        name: 'Group Impact and Engagement',
        type: 'group',
        goal: 'To foster a professional, respectful, and collaborative work environment through consistent demonstration of positive workplace behavior and interpersonal conduct',
        target: 'Discretion of Solutions Manager & Executive Management Team',
        measurement: 'Bamboo Total Scores / (Total survey × 3)',
        tracking: 'Peer and management surveys rate 1-3 (Never, Sometimes, Most of the time)',
        currentValue: 2.6,
        targetValue: 3
      }
    ]
  },
  {
    id: 'marcellus',
    name: 'Marcellus Hoods',
    role: 'Digital Support Technician',
    avatar: 'MH',
    definition: 'The Digital Support Technician provides hands-on technical assistance and maintenance for digital access control systems. This role focuses on diagnosing and resolving hardware and software issues, supporting installations, and ensuring optimal system performance for clients and internal users. The Support Technician plays a key role in delivering reliable and responsive technical support. They provide frontline technical and administrative support for digital access control systems. This role ensures smooth operation of customer-facing platforms, assists with troubleshooting, and supports the technical team in delivering high-quality service and solutions. Success in this role requires a combination of technical proficiency, effective communication, and strong organizational skills.',
    responsibilities: [
      'Customer Support: Respond to technical queries from clients and users, providing guidance and resolving issues related to digital access platforms.',
      'System Monitoring: Assist in monitoring system performance, logging incidents, and escalating issues to the appropriate technical teams.',
      'Documentation & Reporting: Maintain accurate records of support requests, resolutions, and system updates; assist in preparing reports and user guides.',
      'Technical Assistance: Support the setup, configuration, and testing of access control devices and software.',
      'Training & Onboarding: Help new users onboard by providing basic training and support materials for digital access systems.',
      'Collaboration: Work closely with the Technical Solutions team to ensure timely and effective resolution of customer issues.',
      'Process Improvement: Identify recurring issues and suggest improvements to support processes and user experience.'
    ],
    kpis: [
      {
        id: 'tickets-handled',
        name: 'Number of Tickets Handled',
        type: 'individual',
        goal: 'Total number of tickets resolved by the technician. Based on percentage',
        target: '80% excluding dependencies',
        measurement: '(Tickets closed by Technician / Total tickets appointed to Technician) × 100',
        tracking: 'Google Sheets Ticket Management System',
        currentValue: 84,
        targetValue: 80
      },
      {
        id: 'project-completion',
        name: 'On-Time Project/Task Completion Rate',
        type: 'individual',
        goal: 'Percentage of assigned project tasks completed by the agreed deadline.',
        target: '≥ 95%',
        measurement: '(Total Projects Completed / Total Projects) × 100',
        tracking: 'Projects Tracked via ClickUp',
        currentValue: 98,
        targetValue: 95
      },
      {
        id: 'response-time',
        name: 'Average First Response Time',
        type: 'team',
        goal: 'Ensures timely acknowledgment of support tickets and builds customer trust',
        target: '≤ 1 hour during business hours = 100%',
        measurement: '(First Response Time for all emergency tickets / Total number of emergency tickets) × 100',
        tracking: 'Google Sheets Ticket Management System',
        currentValue: 100,
        targetValue: 100
      },
      {
        id: 'project-delivery',
        name: 'On-Time Project Delivery Rate',
        type: 'team',
        goal: 'Percentage of technical support-related projects (e.g., system configurations, installations, integrations) delivered on or before the agreed deadline.',
        target: '≥ 70% on-time delivery',
        measurement: '(Projects delivered on time / Total projects) × 100',
        tracking: 'ClickUp Management System',
        currentValue: 78,
        targetValue: 70
      },
      {
        id: 'engagement',
        name: 'Group Impact and Engagement',
        type: 'group',
        goal: 'To foster a professional, respectful, and collaborative work environment through consistent demonstration of positive workplace behavior and interpersonal conduct',
        target: 'Discretion of Solutions Manager & Executive Management Team',
        measurement: 'Bamboo Total Scores / (Total survey × 3)',
        tracking: 'Peer and management surveys rate 1-3 (Never, Sometimes, Most of the time)',
        currentValue: 2.85,
        targetValue: 3
      }
    ]
  },
  {
    id: 'coenie-test',
    name: 'Coenie Test',
    role: 'Test Account',
    avatar: 'CT',
    definition: 'This is a test account for system testing and demonstration purposes. Use this account to explore the ticket system functionality without affecting real team member data.',
    responsibilities: [
      'Test new ticket creation flow',
      'Test ticket resolution workflow',
      'Verify KPI calculations',
      'Demo system to stakeholders',
      'Quality assurance testing'
    ],
    kpis: [
      {
        id: 'tickets-handled',
        name: 'Number of Tickets Handled',
        type: 'individual',
        goal: 'Total number of tickets resolved by the technician. Based on percentage',
        target: '80% excluding dependencies',
        measurement: '(Tickets closed by Technician / Total tickets appointed to Technician) × 100',
        tracking: 'Google Sheets Ticket Management System',
        currentValue: 0,
        targetValue: 80
      },
      {
        id: 'project-completion',
        name: 'On-Time Project/Task Completion Rate',
        type: 'individual',
        goal: 'Percentage of assigned project tasks completed by the agreed deadline.',
        target: '≥ 95%',
        measurement: '(Total Projects Completed / Total Projects) × 100',
        tracking: 'Projects Tracked via ClickUp',
        currentValue: 0,
        targetValue: 95
      },
      {
        id: 'response-time',
        name: 'Average First Response Time',
        type: 'team',
        goal: 'Ensures timely acknowledgment of support tickets and builds customer trust',
        target: '≤ 1 hour during business hours = 100%',
        measurement: '(First Response Time for all emergency tickets / Total number of emergency tickets) × 100',
        tracking: 'Google Sheets Ticket Management System',
        currentValue: 100,
        targetValue: 100
      },
      {
        id: 'project-delivery',
        name: 'On-Time Project Delivery Rate',
        type: 'team',
        goal: 'Percentage of technical support-related projects (e.g., system configurations, installations, integrations) delivered on or before the agreed deadline.',
        target: '≥ 70% on-time delivery',
        measurement: '(Projects delivered on time / Total projects) × 100',
        tracking: 'ClickUp Management System',
        currentValue: 78,
        targetValue: 70
      },
      {
        id: 'engagement',
        name: 'Group Impact and Engagement',
        type: 'group',
        goal: 'To foster a professional, respectful, and collaborative work environment through consistent demonstration of positive workplace behavior and interpersonal conduct',
        target: 'Discretion of Solutions Manager & Executive Management Team',
        measurement: 'Bamboo Total Scores / (Total survey × 3)',
        tracking: 'Peer and management surveys rate 1-3 (Never, Sometimes, Most of the time)',
        currentValue: 3,
        targetValue: 3
      }
    ]
  }
];

export const teamKPIs = {
  avgTicketsHandled: 83.6,
  avgProjectCompletion: 95.4,
  avgResponseTime: 100,
  projectDeliveryRate: 78,
  avgEngagement: 2.77
};

