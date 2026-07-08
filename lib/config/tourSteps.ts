
export const tourSteps = [
    {
        element: '#tour-welcome',
        popover: {
            title: 'Welcome to ShortlistAI! 🚀',
            description: 'Let us show you how to optimize your resume in 3 simple steps.',
            side: 'bottom',
            align: 'center'
        }
    },
    {
        element: '#tour-upload',
        popover: {
            title: '1. Upload Resume',
            description: 'Upload your existing PDF resume here. We extract the text automatically.',
            side: 'bottom'
        }
    },
    {
        element: '#tour-jd',
        popover: {
            title: '2. Paste Job Description',
            description: 'Paste the JD of the job you want. We analyze keywords to match.',
            side: 'left'
        }
    },
    {
        element: '#tour-analyze',
        popover: {
            title: '3. Generate Analysis',
            description: 'Click here to get your ATS score and missing keywords.',
            side: 'top'
        }
    },
    {
        element: '#tour-profile',
        popover: {
            title: 'Your Profile',
            description: 'manage your account, subscription, and view history here.',
            side: 'bottom'
        }
    }
] as const;
