import { createBrowserRouter } from "react-router-dom";
import PrivateRoute from "./privateRoute";
import Layout from "src/layout";
import Register from "src/pages/register";
import Login from "src/pages/login";
import ProfilePage from "src/pages/profile";
import { FeedPage } from "src/pages/feed/FeedPage";
import { CreatePostPage } from "src/pages/create/CreatePostPage";
import { MyPostsPage } from "src/pages/profile/MyPostsPage";
import { EditProfilePage } from "src/pages/settings/EditProfilePage";
import { SubscriptionSettingsPage } from "src/pages/settings/SubscriptionSettingsPage";
import { SubscribersPage } from "src/pages/settings/SubscribersPage";
import { PaymentSettingsPage } from "src/pages/settings/PaymentSettingsPage";
import { AdvancedPaymentDashboard } from "src/pages/settings/AdvancedPaymentDashboard";
import { MessagingPage } from "src/pages/messaging/MessagingPage";
import { SearchPage } from "src/pages/search/SearchPage";
import { BookmarksPage } from "src/pages/bookmarks/BookmarksPage";

const router = createBrowserRouter([
    {
        path: "/login",
        element: <Login />,
    },
    {
        path: "/register",
        element: <Register />,
    },
    {
        path: "/",
        element: (
            <PrivateRoute>
                <Layout />
            </PrivateRoute>
        ),
        children: [
            {
                path: "/",
                element: <FeedPage />,
            },
            {
                path: "/profile/:username",
                element: <ProfilePage />,
            },
            {
                path: "/feed",
                element: <FeedPage />,
            },

            {
                path: "/create",
                element: <CreatePostPage />,
            },
            {
                path: "/my-posts",
                element: <MyPostsPage />,
            },
            {
                path: "/profile/:id",
                element: <ProfilePage />,
            },
            {
                path: "/settings/profile",
                element: <EditProfilePage />,
            },
            {
                path: "/settings/subscriptions",
                element: <SubscriptionSettingsPage />,
            },
            {
                path: "/settings/subscribers",
                element: <SubscribersPage />,
            },
            {
                path: "/settings/payments",
                element: <PaymentSettingsPage />,
            },
            {
                path: "/settings/payments/advanced",
                element: <AdvancedPaymentDashboard />,
            },
            {
                path: "/messages",
                element: <MessagingPage />,
            },
            {
                path: "/messages/:conversationId",
                element: <MessagingPage />,
            },
            {
                path: "/search",
                element: <SearchPage />,
            },
            // {
            //     path: "/notifications",
            //     element: <NotificationsPage />,
            // },
            {
                path: "/bookmarks",
                element: <BookmarksPage />,
            },
            {
                path: "/bookmarks/collections/:collectionId",
                element: <BookmarksPage />,
            },
        ],
    },
]);

export default router;
