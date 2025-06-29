import { useState } from "react";
import ChatPreview from "src/components/common/chatPreview";
import CustomModal from "src/components/common/customModal";
import PostCard from "src/components/common/PostCard";
import ProfileOfferCard from "src/components/common/ProfileOfferCard";
import { Suggestions } from "src/components/common/suggestions";
import UserPromoCard from "src/components/common/UserPromoCard";

const dummyUsers = [
    {
        backgroundImage:
            "https://thumbs.onlyfans.com/public/files/thumbs/w480/d/df/dfs/dfs2fzh2kcraxtpxjbg1ztghpvxpl4vj1740479678/481933164/header_image.jpg",
        avatar: "https://thumbs.onlyfans.com/public/files/thumbs/c144/8/8f/8ft/8ftrwwuluxoykhoiovqms1is5tid5nai1740479678/481933164/avatar.jpg",
        username: "Kiara",
        handle: "@anishahot",
        isVerified: true,
        status: "Free",
        online: true,
    },
    {
        backgroundImage:
            "https://thumbs.onlyfans.com/public/files/thumbs/w480/d/df/dfs/dfs2fzh2kcraxtpxjbg1ztghpvxpl4vj1740479678/481933164/header_image.jpg",
        avatar: "https://thumbs.onlyfans.com/public/files/thumbs/c144/8/8f/8ft/8ftrwwuluxoykhoiovqms1is5tid5nai1740479678/481933164/avatar.jpg",
        username: "Kiara",
        handle: "@anishahot",
        isVerified: true,
        status: "Free",
        online: true,
    },
    {
        backgroundImage:
            "https://thumbs.onlyfans.com/public/files/thumbs/w480/d/df/dfs/dfs2fzh2kcraxtpxjbg1ztghpvxpl4vj1740479678/481933164/header_image.jpg",
        avatar: "https://thumbs.onlyfans.com/public/files/thumbs/c144/8/8f/8ft/8ftrwwuluxoykhoiovqms1is5tid5nai1740479678/481933164/avatar.jpg",
        username: "Kiara",
        handle: "@anishahot",
        isVerified: true,
        status: "Free",
        online: true,
    },
    {
        backgroundImage:
            "https://thumbs.onlyfans.com/public/files/thumbs/w480/d/df/dfs/dfs2fzh2kcraxtpxjbg1ztghpvxpl4vj1740479678/481933164/header_image.jpg",
        avatar: "https://thumbs.onlyfans.com/public/files/thumbs/c144/8/8f/8ft/8ftrwwuluxoykhoiovqms1is5tid5nai1740479678/481933164/avatar.jpg",
        username: "Kiara",
        handle: "@anishahot",
        isVerified: true,
        status: "Free",
        online: true,
    },
    {
        backgroundImage:
            "https://thumbs.onlyfans.com/public/files/thumbs/w480/d/df/dfs/dfs2fzh2kcraxtpxjbg1ztghpvxpl4vj1740479678/481933164/header_image.jpg",
        avatar: "https://thumbs.onlyfans.com/public/files/thumbs/c144/8/8f/8ft/8ftrwwuluxoykhoiovqms1is5tid5nai1740479678/481933164/avatar.jpg",
        username: "Kiara",
        handle: "@anishahot",
        isVerified: true,
        status: "Free",
        online: true,
    },
    {
        backgroundImage:
            "https://thumbs.onlyfans.com/public/files/thumbs/w480/d/df/dfs/dfs2fzh2kcraxtpxjbg1ztghpvxpl4vj1740479678/481933164/header_image.jpg",
        avatar: "https://thumbs.onlyfans.com/public/files/thumbs/c144/8/8f/8ft/8ftrwwuluxoykhoiovqms1is5tid5nai1740479678/481933164/avatar.jpg",
        username: "Kiara",
        handle: "@anishahot",
        isVerified: true,
        status: "Free",
        online: true,
    },
    {
        backgroundImage:
            "https://thumbs.onlyfans.com/public/files/thumbs/w480/d/df/dfs/dfs2fzh2kcraxtpxjbg1ztghpvxpl4vj1740479678/481933164/header_image.jpg",
        avatar: "https://thumbs.onlyfans.com/public/files/thumbs/c144/8/8f/8ft/8ftrwwuluxoykhoiovqms1is5tid5nai1740479678/481933164/avatar.jpg",
        username: "Kiara",
        handle: "@anishahot",
        isVerified: true,
        status: "Free",
        online: true,
    },
    {
        backgroundImage:
            "https://thumbs.onlyfans.com/public/files/thumbs/w480/d/df/dfs/dfs2fzh2kcraxtpxjbg1ztghpvxpl4vj1740479678/481933164/header_image.jpg",
        avatar: "https://thumbs.onlyfans.com/public/files/thumbs/c144/8/8f/8ft/8ftrwwuluxoykhoiovqms1is5tid5nai1740479678/481933164/avatar.jpg",
        username: "Kiara",
        handle: "@anishahot",
        isVerified: true,
        status: "Free",
        online: true,
    },
    // Add more users here...
];

const Home = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <div className="mb-4 space-y-4">
                <Suggestions title="Suggestions for you" users={dummyUsers} />
                <Suggestions title="Expired Subscriptions" users={dummyUsers} />
            </div>

            <UserPromoCard
                profileImg="https://thumbs.onlyfans.com/public/files/thumbs/c144/8/8f/8ft/8ftrwwuluxoykhoiovqms1is5tid5nai1740479678/481933164/avatar.jpg" // Replace with actual image
                username="Lilly Bloomes"
                handle="lillybloomes"
                isVerified={true}
                promoText="MY FIRST SEX TAPE NOW AVAILABLE! + TWO FREE EXCLUSIVE VIDEO'S WHEN YOU JOIN! 💦"
                offerLink="https://yourpromotionlink.com"
                timestamp="Yesterday"
            />
            <ProfileOfferCard
                bannerImage="https://thumbs.onlyfans.com/public/files/thumbs/w480/d/df/dfs/dfs2fzh2kcraxtpxjbg1ztghpvxpl4vj1740479678/481933164/header_image.jpg"
                profileImage="https://thumbs.onlyfans.com/public/files/thumbs/c144/8/8f/8ft/8ftrwwuluxoykhoiovqms1is5tid5nai1740479678/481933164/avatar.jpg"
                username="Lilly Bloomes"
                handle="lillybloomes"
                isVerified={true}
                status="Available now"
                limitedOfferText="Limited offer - 65% off for 30 days!"
                offerEndDate="Apr 20"
                promoMessage="MY FIRST SEX TAPE NOW AVAILABLE! + TWO FREE EXCLUSIVE VIDEO'S WHEN YOU JOIN! 💦"
                price="$5.25 for 30 days"
                expiryDate="Jul 4, 2024"
                showOfferCard={true}
            />
            <ChatPreview
                profileImage="https://thumbs.onlyfans.com/public/files/thumbs/c144/8/8f/8ft/8ftrwwuluxoykhoiovqms1is5tid5nai1740479678/481933164/avatar.jpg"
                username="Ana 🍌"
                handle="anabanana"
                messagePreview="me & @xxhayjxxx can't keep …"
                time="8:53 pm"
                isOnline={true}
                isVerified={true}
            />
            <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded"
            >
                Open Modal
            </button>

            <CustomModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                width="w-80"
                height="h-[600px]"
                position="top-left"
                showBackdrop={true}
            >
                <div className="p-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold">Jack</h2>
                        <button onClick={() => setIsModalOpen(false)}>
                            ❌
                        </button>
                    </div>
                    <p className="text-sm text-gray-500">@u417589279</p>
                    <div className="my-2 text-sm">14 Fans • 20 Following</div>

                    <ul className="space-y-3 mt-4">
                        <li className="hover:bg-gray-100 px-2 py-1 rounded">
                            👤 My Profile
                        </li>
                        <li className="bg-blue-50 text-blue-600 px-2 py-1 rounded">
                            🖼️ Collections
                        </li>
                        <li className="hover:bg-gray-100 px-2 py-1 rounded">
                            ⚙️ Settings
                        </li>
                        <li className="hover:bg-gray-100 px-2 py-1 rounded">
                            💳 Your Cards{" "}
                            <span className="text-xs text-gray-500">
                                (to subscribe)
                            </span>
                        </li>
                        <li className="hover:bg-gray-100 px-2 py-1 rounded">
                            🏛 Become a creator{" "}
                            <span className="text-xs text-gray-500">
                                (to earn)
                            </span>
                        </li>
                        <li className="hover:bg-gray-100 px-2 py-1 rounded">
                            ❓ Help & Support
                        </li>
                        <li className="hover:bg-gray-100 px-2 py-1 rounded">
                            🌙 Dark Mode
                        </li>
                        <li className="hover:bg-gray-100 px-2 py-1 rounded">
                            🌐 English ⬇️
                        </li>
                        <li className="hover:bg-gray-100 px-2 py-1 rounded text-red-500">
                            🚪 Log Out
                        </li>
                    </ul>
                </div>
            </CustomModal>
            <PostCard
                author={{
                    name: "OnlyFans",
                    handle: "onlyfans",
                    avatar: "https://thumbs.onlyfans.com/public/files/thumbs/c144/8/8f/8ft/8ftrwwuluxoykhoiovqms1is5tid5nai1740479678/481933164/avatar.jpg",
                    postedAt: "21 minutes ago",
                }}
                content="@eminem69 takes on everything - from beta males to gender reveals, hook-ups with Gen Z to sobriety - in her deliriously funny first OFTV stand-up special."
                links={[
                    { label: "onlyfans.com/eminem69", url: "#" },
                    { label: "onlyfans.com/oftv", url: "#" },
                ]}
                thumbnail="https://cdn2.onlyfans.com/files/0/0b/0bef5b9f4234ce181940ab2cfb4867d8/960x1251_8b66bd08dadde3aaf3cee0d1d9676e58.jpg?Tag=2&u=417589279&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6XC9cL2NkbjIub25seWZhbnMuY29tXC9maWxlc1wvMFwvMGJcLzBiZWY1YjlmNDIzNGNlMTgxOTQwYWIyY2ZiNDg2N2Q4XC85NjB4MTI1MV84YjY2YmQwOGRhZGRlM2FhZjNjZWUwZDFkOTY3NmU1OC5qcGc~VGFnPTImdT00MTc1ODkyNzkiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3NDU3Njk2MDB9LCJJcEFkZHJlc3MiOnsiQVdTOlNvdXJjZUlwIjoiMjAyLjY2LjE2NS42XC8zMiJ9fX1dfQ__&Signature=TPhh6WmC1hyiDDv4IHm5sGcEUOoJj5DFqvQqFgldRNb3AYH7hQ~4F958pwcLul2r4QNCm5LhnpqLXLn-q3qbajBuob6VNTKjAcBLoAZGuKNyb28~N0yqhv~oTEvpTVdkgRg36GV5yXo-9XgfeoUeaaVSZhYX0sSFzQ9GLtWsJORRCQSVR7PSOuXXpfiST~1x3J4YB3COn51TbacaJXWTeakBp~GDk8q8ONcI8QndAn7DN8eBJBJFDSQpF~5aTi7SanneASPz-XW6lOs-i3Tk2UyVvCjG5LyDoxOmgIQ04u0WkMWb~Ad7p4AfxNsPnX-sMmMXRWmBUaXCqgzVAsgEuA__&Key-Pair-Id=APKAUSX4CWPPATFK2DGD"
                highlightText={{
                    title: "KERRYN FEEHAN",
                    subtitle: "Don’t Serve Me",
                }}
                users={[
                    {
                        name: "Eminem69",
                        handle: "eminem69",
                        avatar: "https://thumbs.onlyfans.com/public/files/thumbs/c144/8/8f/8ft/8ftrwwuluxoykhoiovqms1is5tid5nai1740479678/481933164/avatar.jpg",
                        banner: "https://thumbs.onlyfans.com/public/files/thumbs/w480/d/df/dfs/dfs2fzh2kcraxtpxjbg1ztghpvxpl4vj1740479678/481933164/header_image.jpg",
                    },
                    {
                        name: "OFTV",
                        handle: "oftv",
                        avatar: "https://thumbs.onlyfans.com/public/files/thumbs/c144/8/8f/8ft/8ftrwwuluxoykhoiovqms1is5tid5nai1740479678/481933164/avatar.jpg",
                        banner: "https://thumbs.onlyfans.com/public/files/thumbs/w480/d/df/dfs/dfs2fzh2kcraxtpxjbg1ztghpvxpl4vj1740479678/481933164/header_image.jpg",
                    },
                ]}
                likes={14}
            />
        </>
    );
};

export default Home;
