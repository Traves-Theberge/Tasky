import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export const SettingSection = ({ title, icon, children }) => {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {children}
      </CardContent>
    </Card>
  );
};