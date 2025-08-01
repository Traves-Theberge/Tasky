import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export const SettingSection = ({ title, icon, children }) => {
  return (
    <Card className="mb-6 bg-gradient-to-br from-card to-muted/20 border-border/50 shadow-elegant rounded-2xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-3 text-card-foreground">
          {icon && (
            <div className="flex items-center justify-center w-8 h-8">
              <span className="text-lg">{icon}</span>
            </div>
          )}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-2 py-4">
        {children}
      </CardContent>
    </Card>
  );
};