import { Mail, Fingerprint, X } from "lucide-react";
import { Input } from "src/components/common/input";
import { Button } from "src/components/common/button";
import { useSetAtom } from "jotai";
import { userAtom } from "src/store";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { authService } from "src/services/auth-service";
import { authStateAtom } from "src/store/auth";

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
    const setuserAtom = useSetAtom(userAtom);
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const setAuthAtom = useSetAtom(authStateAtom);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        try {
            setIsLoading(true);
            setError("");

            const response = await authService.login(data);
            setAuthAtom({
                user: response.data.user,
                isLoading: false,
                isAuthenticated: true,
                error: null,
            });

            setuserAtom(response.data.user);
            navigate("/feed");
        } catch (err) {
            setError(err?.message || "Invalid email or password");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialLogin = (provider: string) => {
        // TODO: Implement social login
        console.log(`Login with ${provider}`);
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            {/* Left side for desktop */}
            <div className="hidden md:flex w-1/2 bg-[#00AEEF] text-white flex-col justify-center items-center p-10">
                <h1 className="text-4xl font-bold mb-4">NuttyFans</h1>
                <p className="text-xl">
                    Sign up to support your favorite creators
                </p>
            </div>

            {/* Right side form */}
            <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-6 py-10">
                <div className="w-full max-w-sm space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold">Log in</h2>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-500 text-sm p-3 rounded-md">
                            {error}
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-6"
                    >
                        <div className="space-y-1">
                            <Input
                                label="Email"
                                placeholder="Email"
                                type="email"
                                {...register("email")}
                                error={errors.email?.message}
                            />
                        </div>

                        <div className="space-y-1">
                            <Input
                                label="Password"
                                placeholder="Password"
                                type="password"
                                {...register("password")}
                                error={errors.password?.message}
                            />
                        </div>

                        <Button
                            className="w-full"
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? "Logging in..." : "Log In"}
                        </Button>
                    </form>

                    <p className="text-xs text-gray-500">
                        By logging in and using OnlyFans, you agree to our
                        <Link
                            to="/terms"
                            className="text-blue-500 cursor-pointer"
                        >
                            {" "}
                            Terms of Service{" "}
                        </Link>
                        and
                        <Link
                            to="/privacy"
                            className="text-blue-500 cursor-pointer"
                        >
                            {" "}
                            Privacy Policy
                        </Link>
                        , and confirm that you are at least 18 years old.
                    </p>

                    <div className="text-sm text-center space-x-2">
                        <Link to="/forgot-password" className="text-blue-500">
                            Forgot password?
                        </Link>
                        <span className="text-gray-400">·</span>
                        <Link to="/register" className="text-blue-500">
                            Sign up for OnlyFans
                        </Link>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">
                                Or continue with
                            </span>
                        </div>
                    </div>

                    <Button
                        className="flex items-center justify-center px-2 w-full"
                        variant="primary"
                        type="button"
                        onClick={() => handleSocialLogin("twitter")}
                    >
                        <X className="mr-2" size={18} />
                        <span>Sign in with X</span>
                    </Button>

                    <Button
                        className="flex items-center justify-center px-2 w-full"
                        variant="primary"
                        type="button"
                        onClick={() => handleSocialLogin("google")}
                    >
                        <Mail className="mr-2" size={18} /> Sign in with Google
                    </Button>

                    <Button
                        className="flex items-center justify-center px-2 w-full"
                        variant="primary"
                        type="button"
                        onClick={() => handleSocialLogin("passwordless")}
                    >
                        <Fingerprint className="mr-2" size={18} /> Passwordless
                        Sign In
                    </Button>
                </div>
            </div>
        </div>
    );
}
