import HomeComponent from "../page/dashboard/home/home.component";
import DocumentTypeComponent from "../page/dashboard/master_data/DocumentTypeComponent";
import FrameworkComponent from "../page/dashboard/master_data/FrameworkComponent";
import UnitComponent from "../page/dashboard/master_data/UnitComponent";
import GeneralDirectorateComponent from "../page/dashboard/master_data/GeneralDirectorateComponent";
import DepartmentComponent from "../page/dashboard/master_data/DepartmentComponent";
import OfficeComponent from "../page/dashboard/master_data/OfficeComponent";
import StatusOfProcessComponent from "../page/dashboard/master_data/StatusOfProcessComponent";
import UserComponent from "../page/dashboard/user/UserComponent";
import DocumentInComponent from "../page/dashboard/document/DocumentInComponent";
import DocumentOutComponent from "../page/dashboard/document/DocumentOutComponent";
import DocumentCreateComponent from "../page/dashboard/document/DocumentCreateComponent";
import DocumentEditComponent from "../page/dashboard/document/DocumentEditComponent";
import DocumentViewPage from "../page/dashboard/document/DocumentViewPage";
import AccountPage from "../page/dashboard/account/AccountPage";
import { ACCESS } from "../page/util/permission";
import {
    LayoutDashboard,
    MessageSquare,
    BarChart3,
    FileText,
    Settings,
    Shield,
    LogOut,
    Users,
    ShoppingCart,
    TrendingUp,
    DollarSign,
    Menu,
    X,
    Search,
    ChevronDown,
    ChevronRight,
    Mail,
    Send,
    BarChart,
    PieChart,
    FileBarChart,
    Landmark,
    Inbox,
    Briefcase,
    Network,
    Building2,
    User,
    Lock,
} from "lucide-react";

class RouteScript {




    routeDashboard() {
        return [
            {

                is_show_sidebar: true,
                is_can_access_route: true,
                name: "ទិន្នន័យសង្ខេប",
                icon: <LayoutDashboard />,
                component: <HomeComponent />,
                url: 'home',
                access: ACCESS.ALL,
                type: 'index',
                breadcrumb: [


                   

                    {
                        name: "ទិន្នន័យសង្ខេប",
                        url: '#',

                    },



                     {
                        name: "ស្ថិតិ",
                        url: '#',

                    },


                ],
                child: []
            },
            {
                is_show_sidebar: true,
                is_can_access_route: true,
                name: "ឯកសារ",
                icon: <FileText />,
                component: null,
                url: 'document',
                type: null,
                breadcrumb: [],
                child: [
                    [
                        {
                            is_show_sidebar: false,
                            is_can_access_route: true,
                            name: "ព័ត៌មានឯកសារចេញ",
                            icon: <Send size={18} />,
                            component: <DocumentViewPage />,
                            url: 'out/view/:id',
                            access: ACCESS.DOC_OUT,
                            type: 'index',
                            breadcrumb: [
                                {
                                    name: "ឯកសារ",
                                    url: null,
                                },
                                {
                                    name: "ចេញ",
                                    url: "document/out",
                                },
                                {
                                    name: "ព័ត៌មានឯកសារ",
                                    url: null,
                                },
                            ],
                            child: []
                        },
                        {
                            is_show_sidebar: false,
                            is_can_access_route: true,
                            name: "ពិនិត្យឯកសារចូល",
                            icon: <Inbox size={18} />,
                            component: <DocumentViewPage />,
                            url: 'in/view/:id',
                            access: ACCESS.DOC_IN,
                            type: 'index',
                            breadcrumb: [
                                {
                                    name: "ឯកសារ",
                                    url: null,
                                },
                                {
                                    name: "ចូល",
                                    url: "document/in",
                                },
                                {
                                    name: "ពិនិត្យឯកសារ",
                                    url: null,
                                },
                            ],
                            child: []
                        },
                        {
                            is_show_sidebar: false,
                            is_can_access_route: true,
                            name: "កែប្រែឯកសារចេញ",
                            icon: <Send size={18} />,
                            component: <DocumentEditComponent />,
                            url: 'out/edit/:id',
                            access: ACCESS.DOC_OUT,
                            type: 'index',
                            breadcrumb: [
                                {
                                    name: "ឯកសារ",
                                    url: null,
                                },
                                {
                                    name: "ចេញ",
                                    url: "document/out",
                                },
                                {
                                    name: "កែប្រែឯកសារចេញ",
                                    url: null,
                                },
                            ],
                            child: []
                        },
                        {
                            is_show_sidebar: false,
                            is_can_access_route: true,
                            name: "ឯកសារចេញ",
                            icon: <Send size={18} />,
                            component: <DocumentCreateComponent />,
                            url: 'out/create',
                            access: ACCESS.DOC_OUT,
                            type: 'index',
                            breadcrumb: [
                                {
                                    name: "ឯកសារ",
                                    url: null,
                                },
                                {
                                    name: "ចេញ",
                                    url: "document/out",
                                },
                                {
                                    name: "ឯកសារចេញ",
                                    url: null,
                                },
                            ],
                            child: []
                        },
                        {
                            is_show_sidebar: true,
                            is_can_access_route: true,
                            name: "ចូល",
                            icon: <Inbox size={18} />,
                            component: <DocumentInComponent />,
                            url: 'in',
                            access: ACCESS.DOC_IN,
                            type: 'index',
                            breadcrumb: [
                                {
                                    name: "ឯកសារ",
                                    url: null,
                                },
                                {
                                    name: "ចូល",
                                    url: null,
                                },
                            ],
                            child: []
                        },
                        {
                            is_show_sidebar: true,
                            is_can_access_route: true,
                            name: "ចេញ",
                            icon: <Send size={18} />,
                            component: <DocumentOutComponent />,
                            url: 'out',
                            access: ACCESS.DOC_OUT,
                            type: 'index',
                            breadcrumb: [
                                {
                                    name: "ឯកសារ",
                                    url: null,
                                },
                                {
                                    name: "ចេញ",
                                    url: null,
                                },
                            ],
                            child: []
                        },
                    ]
                ]
            },
            {
                is_show_sidebar: true,
                is_can_access_route: true,
                name: "ទិន្នន័យមេ",
                icon: <FileBarChart />,
                component: null,
                url: 'master-data',
                access: ACCESS.SUPER,
                type: null,
                breadcrumb: [],
                child: [
                    [
                        {
                            is_show_sidebar: true,
                            is_can_access_route: true,
                            name: "ប្រភេទឯកសារ",
                            icon: <FileText size={18} />,
                            component: <DocumentTypeComponent />,
                            url: 'type-of-document',
                            type: 'index',
                            breadcrumb: [
                                {
                                    name: "ទិន្នន័យមេ",
                                    url: null,
                                },
                                {
                                    name: "ប្រភេទឯកសារ",
                                    url: null,
                                },
                            ],
                            child: []
                        },
                        {
                            is_show_sidebar: true,
                            is_can_access_route: true,
                            name: "ក្របខណ្ឌ",
                            icon: <Network size={18} />,
                            component: <FrameworkComponent />,
                            url: 'framework',
                            type: 'index',
                            breadcrumb: [
                                {
                                    name: "ទិន្នន័យមេ",
                                    url: null,
                                },
                                {
                                    name: "ក្របខណ្ឌ",
                                    url: null,
                                },
                            ],
                            child: []
                        },
                        {
                            is_show_sidebar: true,
                            is_can_access_route: true,
                            name: "ស្ថានភាពដំណើរការ",
                            icon: <FileText size={18} />,
                            component: <StatusOfProcessComponent />,
                            url: 'status-of-process',
                            type: 'index',
                            breadcrumb: [
                                {
                                    name: "ទិន្នន័យមេ",
                                    url: null,
                                },
                                {
                                    name: "ស្ថានភាពដំណើរការ",
                                    url: null,
                                },
                            ],
                            child: []
                        },
                    ]
                ]
            },
            {
                is_show_sidebar: true,
                is_can_access_route: true,
                name: "ស្ថាប័ន",
                icon: <Landmark />,
                component: null,
                url: 'organization',
                access: ACCESS.SUPER,
                type: null,
                breadcrumb: [],
                child: [
                    [
                        {
                            is_show_sidebar: true,
                            is_can_access_route: true,
                            name: "អង្គភាព",
                            icon: <Landmark size={18} />,
                            component: <UnitComponent />,
                            url: 'unit',
                            type: 'index',
                            breadcrumb: [
                                {
                                    name: "ស្ថាប័ន",
                                    url: null,
                                },
                                {
                                    name: "អង្គភាព",
                                    url: null,
                                },
                            ],
                            child: []
                        },
                        {
                            is_show_sidebar: true,
                            is_can_access_route: true,
                            name: "អគ្គនាយកដ្ឋាន",
                            icon: <Building2 size={18} />,
                            component: <GeneralDirectorateComponent />,
                            url: 'general-directorate',
                            type: 'index',
                            breadcrumb: [
                                {
                                    name: "ស្ថាប័ន",
                                    url: null,
                                },
                                {
                                    name: "អគ្គនាយកដ្ឋាន",
                                    url: null,
                                },
                            ],
                            child: []
                        },
                        {
                            is_show_sidebar: true,
                            is_can_access_route: true,
                            name: "នាយកដ្ឋាន",
                            icon: <Briefcase size={18} />,
                            component: <DepartmentComponent />,
                            url: 'department',
                            type: 'index',
                            breadcrumb: [
                                {
                                    name: "ស្ថាប័ន",
                                    url: null,
                                },
                                {
                                    name: "នាយកដ្ឋាន",
                                    url: null,
                                },
                            ],
                            child: []
                        },
                        {
                            is_show_sidebar: true,
                            is_can_access_route: true,
                            name: "ការិយាល័យ",
                            icon: <Users size={18} />,
                            component: <OfficeComponent />,
                            url: 'office',
                            type: 'index',
                            breadcrumb: [
                                {
                                    name: "ស្ថាប័ន",
                                    url: null,
                                },
                                {
                                    name: "ការិយាល័យ",
                                    url: null,
                                },
                            ],
                            child: []
                        },
                    ]
                ]
            },
            {
                is_show_sidebar: true,
                is_can_access_route: true,
                name: "អ្នកប្រើប្រាស់",
                icon: <Users />,
                component: <UserComponent />,
                url: 'users',
                access: ACCESS.SUPER,
                type: 'index',
                breadcrumb: [
                    {
                        name: "អ្នកប្រើប្រាស់",
                        url: null,
                    },
                ],
                child: []
            },
            {
                // opened from the "គណនី" button under the e-mail (not listed in the sidebar menu)
                is_show_sidebar: false,
                is_can_access_route: true,
                name: "គណនីរបស់ខ្ញុំ",
                icon: <User />,
                component: <AccountPage />,
                url: 'account',
                access: ACCESS.ALL,
                type: 'index',
                breadcrumb: [
                    {
                        name: "គណនីរបស់ខ្ញុំ",
                        url: null,
                    },
                ],
                child: []
            },

        ]
    }


}



export default RouteScript;