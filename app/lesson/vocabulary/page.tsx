'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

export default function VocabularyPage() {
  const router = useRouter();

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Vocabulary Management</h1>
            <p className="text-muted-foreground mt-1">Manage vocabulary words and definitions</p>
          </div>
          <Button className="bg-gradient-to-r from-blue-900 to-blue-600">
            <Icon name="PlusIcon" size={18} className="mr-2" />
            Add Vocabulary
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Vocabulary</CardTitle>
            <CardDescription>View and manage vocabulary items</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Icon name="LanguageIcon" size={64} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Vocabulary management interface</p>
              <p className="text-sm text-muted-foreground mt-2">Add and manage vocabulary words for units</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
