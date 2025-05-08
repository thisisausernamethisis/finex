-- Create case-insensitive index for theme template name search
CREATE INDEX idx_theme_template_name_ci ON "ThemeTemplate" (LOWER(name));
