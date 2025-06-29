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

const registerSchema = z
    .object({
        name: z.string().min(2, "Full name must be at least 2 characters"),
        username: z
            .string()
            .min(3, "Username must be at least 3 characters")
            .regex(
                /^[a-zA-Z0-9_]+$/,
                "Username can only contain letters, numbers, and underscores"
            ),
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
    const setuserAtom = useSetAtom(userAtom);
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormData) => {
        try {
            setIsLoading(true);
            setError("");

            // Remove confirmPassword as it's not needed for the API
            const { ...registerData } = data;
            const response = await authService.register(registerData);
            setuserAtom(response.data.user);
            navigate("/");
        } catch (err) {
            setError(
                err?.message || "Failed to create account. Please try again."
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialLogin = (provider: string) => {
        // TODO: Implement social login
        console.log(`Register with ${provider}`);
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            {/* Left side for desktop */}
            <div className="hidden md:flex w-1/2 bg-[#00AEEF] text-white flex-col justify-center items-center p-10">
                <h1 className="text-4xl font-bold mb-4">NuttyFans</h1>
                <p className="text-xl">Join the community and start earning</p>
            </div>

            {/* Right side form */}
            <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-6 py-10">
                <div className="w-full max-w-sm space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold">
                            Create Account
                        </h2>
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
                                label="Full Name"
                                placeholder="Full Name"
                                type="text"
                                {...register("name")}
                                error={errors.name?.message}
                            />
                        </div>

                        <div className="space-y-1">
                            <Input
                                label="Username"
                                placeholder="Username"
                                type="text"
                                {...register("username")}
                                error={errors.username?.message}
                            />
                        </div>

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

                        <div className="space-y-1">
                            <Input
                                label="Confirm Password"
                                placeholder="Confirm Password"
                                type="password"
                                {...register("confirmPassword")}
                                error={errors.confirmPassword?.message}
                            />
                        </div>

                        <Button
                            className="w-full"
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? "Creating Account..." : "Sign Up"}
                        </Button>
                    </form>

                    <p className="text-xs text-gray-500">
                        By signing up and using OnlyFans, you agree to our
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

                    <div className="text-sm text-center">
                        <span className="text-gray-600">
                            Already have an account?
                        </span>{" "}
                        <Link to="/login" className="text-blue-500">
                            Log in
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
                        <span>Sign up with X</span>
                    </Button>

                    <Button
                        className="flex items-center justify-center px-2 w-full"
                        variant="primary"
                        type="button"
                        onClick={() => handleSocialLogin("google")}
                    >
                        <Mail className="mr-2" size={18} /> Sign up with Google
                    </Button>

                    <Button
                        className="flex items-center justify-center px-2 w-full"
                        variant="primary"
                        type="button"
                        onClick={() => handleSocialLogin("passwordless")}
                    >
                        <Fingerprint className="mr-2" size={18} /> Passwordless
                        Sign Up
                    </Button>
                </div>
            </div>
        </div>
    );
}
