"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FaFileContract, FaArrowLeft, FaCheck, FaTimes, FaExclamationTriangle } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

export default function TermsPage() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("introduction");

  const sections = [
    { id: "introduction", title: "Introduction", icon: FaFileContract },
    { id: "acceptance", title: "Acceptance of Terms", icon: FaCheck },
    { id: "services", title: "Services Description", icon: FaFileContract },
    { id: "responsibilities", title: "User Responsibilities", icon: FaExclamationTriangle },
    { id: "payments", title: "Payments & Refunds", icon: FaFileContract },
    { id: "limitations", title: "Limitations & Disclaimers", icon: FaExclamationTriangle },
    { id: "termination", title: "Termination", icon: FaTimes },
    { id: "governing", title: "Governing Law", icon: FaFileContract },
  ];

  const termsContent = {
    introduction: {
      title: "Introduction",
      content: [
        "Welcome to Mintward, an investment platform that facilitates reward-based investment services.",
        "These Terms of Service ('Terms') govern your use of Mintward's platform, website, and related services (collectively, the 'Service').",
        "By accessing or using our Service, you agree to be bound by these Terms, our Privacy Policy, and any additional terms and conditions referenced herein.",
        "If you do not agree to these Terms, you may not access or use our Service."
      ]
    },
    acceptance: {
      title: "Acceptance of Terms",
      content: [
        "By creating an account, accessing our platform, or using our services, you acknowledge that you have read, understood, and agree to be bound by these Terms.",
        "You must be at least 18 years of age or the legal age of majority in your jurisdiction to use our Service.",
        "You represent and warrant that you have the legal capacity to enter into these Terms.",
        "Mintward reserves the right to modify these Terms at any time. Continued use of the Service after such modifications constitutes acceptance of the updated Terms."
      ]
    },
    services: {
      title: "Services Description",
      content: [
        "Mintward provides an investment platform that connects users with reward-based investment opportunities.",
        "Our services include but are not limited to: investment processing, reward distribution, account management, and transaction monitoring.",
        "Investment returns and rewards are not guaranteed and may vary based on market conditions and service performance.",
        "Mintward acts as an intermediary platform and is not responsible for the performance of individual investment services."
      ]
    },
    responsibilities: {
      title: "User Responsibilities",
      content: [
        "You are responsible for maintaining the confidentiality of your account credentials.",
        "You must provide accurate, current, and complete information during registration and account setup.",
        "You agree to use our Service only for lawful purposes and in accordance with these Terms.",
        "You are solely responsible for all activities conducted under your account.",
        "You must not attempt to gain unauthorized access to our systems or interfere with the operation of our Service."
      ]
    },
    payments: {
      title: "Payments & Refunds",
      content: [
        "All investments are processed through secure payment gateways approved by Mintward.",
        "Investment amounts, rewards, and processing fees are clearly displayed before transaction confirmation.",
        "Refunds, if applicable, are subject to the specific terms of each investment service and our refund policy.",
        "Mintward is not responsible for delays caused by payment processors or financial institutions.",
        "Transaction fees, if any, will be disclosed prior to payment processing."
      ]
    },
    limitations: {
      title: "Limitations & Disclaimers",
      content: [
        "Investment returns are not guaranteed. Past performance does not indicate future results.",
        "Our Service is provided 'as is' without warranties of any kind, either express or implied.",
        "Mintward does not provide financial advice. All investment decisions should be made based on your own research and risk assessment.",
        "We are not liable for any losses arising from investment decisions made through our platform.",
        "Technical issues, maintenance, or service interruptions may occur without notice."
      ]
    },
    termination: {
      title: "Termination",
      content: [
        "You may terminate your account at any time by following the account closure procedure in your account settings.",
        "Mintward reserves the right to suspend or terminate accounts that violate these Terms or engage in fraudulent activities.",
        "Upon termination, your right to use the Service will cease immediately.",
        "Mintward may retain certain information as required by law or for legitimate business purposes.",
        "Outstanding investments and rewards will be processed according to the respective service terms."
      ]
    },
    governing: {
      title: "Governing Law",
      content: [
        "These Terms shall be governed by and construed in accordance with the laws of India.",
        "Any disputes arising from these Terms or your use of the Service shall be subject to the exclusive jurisdiction of the courts in India.",
        "If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.",
        "Failure to enforce any provision of these Terms does not constitute a waiver of such provision."
      ]
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative w-16 h-16">
              <Image
                src="/logo.png"
                alt="Mintward Logo"
                fill
                className="object-contain animate-pulse"
                priority
              />
            </div>
            <Spinner variant="bars" size={32} className="text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6"
          >
            <FaArrowLeft className="mr-2" />
            Back
          </Button>

          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative w-16 h-16">
                <Image
                  src="/logo.png"
                  alt="Mintward Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Please read these Terms of Service carefully before using Mintward's investment platform.
            </p>
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <Button
                    key={section.id}
                    variant={activeSection === section.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveSection(section.id)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-3 w-3" />
                    {section.title}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {(() => {
                const Icon = sections.find(s => s.id === activeSection)?.icon || FaFileContract;
                return <Icon className="h-5 w-5 text-primary" />;
              })()}
              {termsContent[activeSection as keyof typeof termsContent].title}
            </CardTitle>
            <CardDescription>
              {activeSection === "introduction" && "Welcome to Mintward's investment platform"}
              {activeSection === "acceptance" && "Your agreement to our terms and conditions"}
              {activeSection === "services" && "What we offer and how it works"}
              {activeSection === "responsibilities" && "What you need to know about using our platform"}
              {activeSection === "payments" && "Financial transactions and refund policies"}
              {activeSection === "limitations" && "Important disclaimers and limitations"}
              {activeSection === "termination" && "How accounts can be closed"}
              {activeSection === "governing" && "Legal framework and jurisdiction"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {termsContent[activeSection as keyof typeof termsContent].content.map((paragraph, index) => (
              <p key={index} className="text-sm leading-relaxed text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Contact Us</CardTitle>
            <CardDescription>
              Have questions about our Terms of Service? We're here to help.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Email:</strong> support@montra.com</p>
              <p><strong>Business Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM IST</p>
              <p><strong>Response Time:</strong> Within 24-48 hours</p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>By using Mintward, you acknowledge that you have read and understood these Terms of Service.</p>
        </div>
      </div>
    </div>
  );
}