import Link from 'next/link';
import { Database, Search, FileText, Users, Map, Shield, Sparkles, ArrowRight, Globe, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/app-layout';

export default function AboutPage() {
  return (
    <AppLayout>
      <div className="p-4 sm:p-6 max-w-5xl mx-auto">
        {/* Hero */}
        <div className="text-center py-12 mb-10">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary mb-5">
            <Database className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3">About Neurive</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Karnataka's AI-Powered Digital Archive Intelligence Platform
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <Badge variant="secondary">Karnataka Archives</Badge>
            <Badge variant="secondary">AI-Powered</Badge>
            <Badge variant="secondary">1M+ Records</Badge>
            <Badge variant="secondary">Open Access</Badge>
          </div>
        </div>

        {/* Mission */}
        <div className="prose max-w-none mb-12">
          <Card className="border bg-primary/5 mb-6">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-foreground mb-3">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                Neurive is dedicated to preserving, digitizing, and providing intelligent access to Karnataka's vast historical heritage. We believe that every citizen should have easy access to the archival records that define our state's rich history — from ancient land grants and temple inscriptions to colonial-era court records and modern administrative documents.
              </p>
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-2 gap-5 mb-8">
            {[
              {
                icon: Database,
                title: 'Comprehensive Coverage',
                desc: 'Over 1,000,000 archival records spanning 200+ years of Karnataka history, covering all 30 districts and 12 major archive categories.'
              },
              {
                icon: Sparkles,
                title: 'AI-Powered Search',
                desc: 'Advanced semantic search using OpenAI embeddings understands the meaning behind your queries, not just keywords, in both Kannada and English.'
              },
              {
                icon: Globe,
                title: 'Bilingual Platform',
                desc: 'Fully designed for Karnataka\'s linguistic identity — supporting both ಕನ್ನಡ (Kannada) and English throughout the platform.'
              },
              {
                icon: Shield,
                title: 'Government Partnership',
                desc: 'Official partnership with Karnataka State Archives, Revenue Department, and multiple government agencies to ensure authentic, authoritative records.'
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4 p-5 rounded-xl border bg-card">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technology Stack */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">Technology</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { name: 'Next.js 14', desc: 'React framework' },
              { name: 'TypeScript', desc: 'Type safety' },
              { name: 'Supabase', desc: 'Database & Auth' },
              { name: 'OpenAI', desc: 'AI embeddings' },
              { name: 'Tailwind CSS', desc: 'Styling' },
              { name: 'shadcn/ui', desc: 'Components' },
              { name: 'Tesseract OCR', desc: 'Text extraction' },
              { name: 'pgvector', desc: 'Vector search' },
            ].map(({ name, desc }) => (
              <div key={name} className="p-3 rounded-lg border bg-card text-center">
                <p className="text-sm font-semibold text-foreground">{name}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Archive Coverage */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">Archive Coverage</h2>
          <div className="grid sm:grid-cols-3 gap-4 text-center">
            {[
              { value: '1,000,000+', label: 'Digitized Records' },
              { value: '200+', label: 'Years of History' },
              { value: '30', label: 'Karnataka Districts' },
              { value: '12', label: 'Archive Categories' },
              { value: '2', label: 'Languages Supported' },
              { value: '75%', label: 'OCR Coverage' },
            ].map(({ value, label }) => (
              <div key={label} className="p-4 rounded-xl border bg-card">
                <p className="text-2xl font-bold text-primary mb-1">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Partner Departments */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">Partner Departments</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              'Karnataka State Archives (KSA)',
              'Revenue Department, Karnataka',
              'Department of Archaeology & Museums',
              'Karnataka Gazetteer Department',
              'High Court of Karnataka',
              'Department of Public Libraries',
              'Endowments Department (Muzrai)',
              'Karnataka Forest Department',
            ].map((dept) => (
              <div key={dept} className="flex items-center gap-2.5 p-3 rounded-lg border bg-card text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                {dept}
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">Core Team</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[
              { name: 'Jeevan Gowda H M', role: 'Lead Architect', email: 'jeevan.gowda@neurive.gov.in', phone: '6362981285' },
              { name: 'Niranjan', role: 'Full Stack Developer', email: 'niranjan@neurive.gov.in', phone: '+91 XXXXX XXXXX' },
              { name: 'Koushik', role: 'AI Engineer', email: 'koushik@neurive.gov.in', phone: '+91 XXXXX XXXXX' },
              { name: 'Kushwanth', role: 'UI/UX Designer', email: 'kushwanth@neurive.gov.in', phone: '+91 XXXXX XXXXX' },
              { name: 'Milan', role: 'Database Specialist', email: 'milan@neurive.gov.in', phone: '+91 XXXXX XXXXX' },
              { name: 'Kushal', role: 'DevOps Engineer', email: 'kushal@neurive.gov.in', phone: '+91 XXXXX XXXXX' },
            ].map(({ name, role, email, phone }) => (
              <div key={name} className="p-4 rounded-lg border bg-card hover:border-primary/50 transition-colors group">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-3 group-hover:from-primary/30 group-hover:to-primary/20 transition-colors">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-0.5 text-sm">{name}</h3>
                <p className="text-xs text-muted-foreground mb-2.5">{role}</p>
                <div className="space-y-1.5">
                  <p className="text-xs text-primary hover:underline cursor-pointer break-all">{email}</p>
                  <p className="text-xs text-muted-foreground font-mono">{phone}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center py-10 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border">
          <h2 className="text-xl font-bold mb-2">Ready to Explore?</h2>
          <p className="text-muted-foreground mb-6 text-sm">Start searching Karnataka's digital heritage today</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/search"><Button className="gap-2"><Search className="h-4 w-4" />Search Archives</Button></Link>
            <Link href="/contact"><Button variant="outline" className="gap-2">Contact Us <ArrowRight className="h-4 w-4" /></Button></Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
