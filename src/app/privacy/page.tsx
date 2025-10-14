"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FaShieldAlt, FaArrowLeft, FaUserShield, FaDatabase, FaCookie, FaLock, FaEye, FaUserEdit, FaTrash } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { User } from "lucide-react";

export default function PrivacyPage() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("introduction");

  const sections = [
    { id: "introduction", title: "Introduction", icon: FaShieldAlt },
    { id: "collection", title: "Data Collection", icon: FaDatabase },
    { id: "usage", title: "Data Usage", icon: FaUserShield },
    { id: "sharing", title: "Data Sharing", icon: FaEye },
    { id: "security", title: "Data Security", icon: FaLock },
    { id: "cookies", title: "Cookies", icon: FaCookie },
    { id: "rights", title: "Your Rights", icon: FaUserEdit },
    { id: "retention", title: "Data Retention", icon: FaTrash },
  ];

  const privacyContent = {
    introduction: {
      title: "Introduction to Privacy Policy",
      content: [
        "At Mintward, we are committed to protecting your privacy and ensuring the security of your personal information.",
        "This Privacy Policy explains how we collect, use, share, and protect your data when you use our investment platform and related services.",
        "We are dedicated to maintaining the trust you place in us and adhere to applicable data protection laws, including India's Information Technology Act and relevant regulations.",
        "By using Mintward, you acknowledge that you have read, understood, and agree to the collection and use of your information as described in this Privacy Policy."
      ]
    },
    collection: {
      title: "Data We Collect",
      content: [
        "**Personal Information:** When you register for an account, we collect your name, email address, phone number, and other identification information necessary for account creation and verification.",
        "**Financial Information:** We collect payment information, bank account details, and transaction history necessary for processing investments and rewards. This information is encrypted and handled by secure payment processors.",
        "**Usage Data:** We collect information about how you interact with our platform, including pages visited, features used, and time spent, to improve our services.",
        "**Device Information:** We collect device information including IP address, browser type, operating system, and unique device identifiers for security and service optimization.",
        "**Communications:** We record your communications with our customer support team to provide better service and maintain quality standards."
      ]
    },
    usage: {
      title: "How We Use Your Data",
      content: [
        "**Service Provision:** We use your information to provide, maintain, and improve our investment platform services, including processing transactions and managing your account.",
        "**Security and Fraud Prevention:** We analyze user behavior and transaction patterns to detect and prevent fraudulent activities, ensuring the security of all users.",
        "**Customer Support:** We use your information to respond to your inquiries, provide technical support, and resolve issues you may encounter.",
        "**Legal Compliance:** We use your data to comply with legal obligations, regulatory requirements, and lawful requests from authorities.",
        "**Service Improvement:** We analyze usage patterns and feedback to enhance our platform's features, user experience, and overall service quality.",
        "**Communication:** We send you important updates about your account, transactions, and relevant service information through email and in-app notifications."
      ]
    },
    sharing: {
      title: "Data Sharing and Disclosure",
      content: [
        "**Payment Processors:** We share necessary financial information with trusted payment processors and banks to facilitate secure transactions and investment processing.",
        "**Service Providers:** We may share data with third-party service providers who perform functions on our behalf, such as hosting, analytics, and customer support, under strict confidentiality agreements.",
        "**Legal Requirements:** We may disclose your information when required by law, court order, or government authority, or to protect our rights, property, or safety.",
        "**Business Transfers:** In the event of a merger, acquisition, or sale of assets, user information may be transferred as part of the business transaction, subject to privacy protection standards.",
        "**Aggregated Data:** We may share anonymized, aggregated data that does not identify individuals for research, marketing, or business development purposes.",
        "**We do not sell your personal information to third parties for marketing purposes.**"
      ]
    },
    security: {
      title: "Data Security Measures",
      content: [
        "**Encryption:** All sensitive data, including financial information and personal details, is encrypted using industry-standard encryption protocols (SSL/TLS) during transmission.",
        "**Secure Storage:** Your data is stored on secure servers with advanced security measures, including firewalls, intrusion detection systems, and regular security audits.",
        "**Access Control:** Only authorized personnel with a legitimate business need can access your personal information, and all access is logged and monitored.",
        "**Regular Audits:** We conduct regular security assessments and vulnerability testing to identify and address potential security risks.",
        "**Compliance:** We maintain compliance with international security standards including ISO 27001 and relevant data protection regulations.",
        "**Incident Response:** We have established procedures for detecting, responding to, and reporting security incidents that may affect your data."
      ]
    },
    cookies: {
      title: "Cookies and Tracking Technologies",
      content: [
        "**Essential Cookies:** We use essential cookies that are necessary for the basic functioning of our website and services, including maintaining your session and security.",
        "**Performance Cookies:** We use analytics cookies to understand how our platform is used, measure performance, and identify areas for improvement.",
        "**Functional Cookies:** These cookies remember your preferences and choices to provide a more personalized experience on subsequent visits.",
        "**Marketing Cookies:** With your consent, we may use marketing cookies to show you relevant advertisements and promotional content based on your interests.",
        "**Cookie Management:** You can control cookie settings through your browser preferences and our cookie consent banner.",
        "**Third-Party Cookies:** Some services on our platform may use third-party cookies with their own privacy policies."
      ]
    },
    rights: {
      title: "Your Privacy Rights",
      content: [
        "**Access:** You have the right to request access to the personal information we hold about you and understand how it's being used.",
        "**Correction:** You can request correction of inaccurate or incomplete personal information we maintain about you.",
        "**Deletion:** You may request deletion of your personal information, subject to legal obligations and legitimate business interests.",
        "**Portability:** You can request a copy of your data in a structured, machine-readable format for transfer to another service provider.",
        "**Objection:** You can object to processing of your personal information in certain circumstances, such as for direct marketing purposes.",
        "**Withdraw Consent:** Where processing is based on consent, you can withdraw that consent at any time without affecting the lawfulness of prior processing.",
        "**Complaint:** You have the right to lodge a complaint with relevant data protection authorities about our data processing practices."
      ]
    },
    retention: {
      title: "Data Retention Policy",
      content: [
        "**Account Information:** We retain your account information for as long as your account remains active or as needed to provide you with our services.",
        "**Transaction Records:** Financial and transaction records are retained for the period required by law and for legitimate business purposes, typically 7 years.",
        "**Legal Requirements:** Some data must be retained for specific periods to comply with legal, regulatory, tax, or accounting requirements.",
        "**Automatic Deletion:** Personal information that is no longer needed for its original purpose is securely deleted or anonymized in accordance with our data retention policy.",
        "**User Request:** We will delete your personal information upon your Request, subject to legal obligations and legitimate business interests.",
        "**Backup Data:** Deleted information may remain in backup systems for a limited time before permanent deletion, and will not be accessed during this period."
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
            <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Your privacy is important to us. Learn how we collect, use, and protect your personal information.
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
                const Icon = sections.find(s => s.id === activeSection)?.icon || FaShieldAlt;
                return <Icon className="h-5 w-5 text-primary" />;
              })()}
              {privacyContent[activeSection as keyof typeof privacyContent].title}
            </CardTitle>
            <CardDescription>
              {activeSection === "introduction" && "Our commitment to protecting your privacy"}
              {activeSection === "collection" && "What information we collect and why"}
              {activeSection === "usage" && "How we use your data to serve you better"}
              {activeSection === "sharing" && "When and how we share your information"}
              {activeSection === "security" && "Measures we take to protect your data"}
              {activeSection === "cookies" && "How we use cookies and tracking technologies"}
              {activeSection === "rights" && "Your rights and control over your data"}
              {activeSection === "retention" && "How long we keep your information"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {privacyContent[activeSection as keyof typeof privacyContent].content.map((paragraph, index) => (
              <p
                key={index}
                className="text-sm leading-relaxed text-muted-foreground"
                dangerouslySetInnerHTML={{
                  __html: paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                }}
              />
            ))}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FaShieldAlt className="h-5 w-5 text-primary" />
              Privacy Contact
            </CardTitle>
            <CardDescription>
              Questions about your privacy? Our privacy team is here to help.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Privacy Email:</strong> privacy@montra.com</p>
              <p><strong>Support Email:</strong> support@montra.com</p>
              <p><strong>Data Protection Officer:</strong> dpo@montra.com</p>
              <p><strong>Response Time:</strong> Within 7 business days for privacy inquiries</p>
              <p><strong>Address:</strong> [Your Business Address, City, State, PIN Code]</p>
            </div>
          </CardContent>
        </Card>

        {/* Your Rights Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Exercise Your Rights</CardTitle>
            <CardDescription>
              Quick access to manage your privacy preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                <FaUserEdit className="h-5 w-5 mb-2 text-primary" />
                <div className="text-left">
                  <div className="font-medium">Request Data</div>
                  <div className="text-xs text-muted-foreground">Get a copy of your personal data</div>
                </div>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                <FaTrash className="h-5 w-5 mb-2 text-destructive" />
                <div className="text-left">
                  <div className="font-medium">Delete Account</div>
                  <div className="text-xs text-muted-foreground">Request permanent deletion</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>We are committed to protecting your privacy and maintaining your trust in our services.</p>
        </div>
      </div>
    </div>
  );
}