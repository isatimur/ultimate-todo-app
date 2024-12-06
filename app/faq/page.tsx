'use client';

import { useState } from 'react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { IconSearch } from '@tabler/icons-react';

const faqs = [
    {
        question: "How do I get started?",
        answer: "Begin by creating your first task or project. You can do this by clicking the '+' button in the tasks section."
    },
    {
        question: "How does the Pomodoro timer work?",
        answer: "The Pomodoro technique uses 25-minute focused work sessions followed by short breaks. You can customize the duration in settings."
    },
    // Add more FAQs...
];

export default function FAQPage() {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredFaqs = faqs.filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="container max-w-4xl py-8">
            <h1 className="text-3xl font-bold mb-8">Help & FAQ</h1>

            <div className="relative mb-8">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Search FAQ..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <Card className="p-6">
                <Accordion type="single" collapsible className="space-y-2">
                    {filteredFaqs.map((faq, index) => (
                        <AccordionItem key={index} value={`item-${index}`}>
                            <AccordionTrigger className="text-left">
                                {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </Card>
        </div>
    );
} 