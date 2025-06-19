-- Migration SQL pour le système d'administration - VERSION FIXÉE
-- À exécuter dans l'éditeur SQL de Supabase
-- Cette version supprime d'abord les objets existants pour éviter les conflits

-- 1. Supprimer les objets existants dans l'ordre inverse des dépendances

-- Supprimer les triggers
DROP TRIGGER IF EXISTS trigger_grant_prospect_access ON public.users;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS grant_prospect_access();
DROP FUNCTION IF EXISTS create_user_with_temp_password(TEXT, TEXT, TEXT, TEXT, UUID, user_status);
DROP FUNCTION IF EXISTS is_admin(UUID);

-- Supprimer les politiques RLS
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;

DROP POLICY IF EXISTS "Users can view own course access" ON public.user_course_access;
DROP POLICY IF EXISTS "Users can manage own course access" ON public.user_course_access;
DROP POLICY IF EXISTS "Admins can manage all course access" ON public.user_course_access;

DROP POLICY IF EXISTS "Users can view own temp passwords" ON public.temporary_passwords;
DROP POLICY IF EXISTS "Admins can manage temp passwords" ON public.temporary_passwords;

-- Supprimer les index
DROP INDEX IF EXISTS idx_users_role;
DROP INDEX IF EXISTS idx_users_status;
DROP INDEX IF EXISTS idx_user_course_access_user_id;
DROP INDEX IF EXISTS idx_user_course_access_course;
DROP INDEX IF EXISTS idx_temporary_passwords_user_id;

-- Supprimer les tables
DROP TABLE IF EXISTS public.temporary_passwords;
DROP TABLE IF EXISTS public.user_course_access;

-- Supprimer les colonnes ajoutées à la table users (si elles existent)
ALTER TABLE public.users 
DROP COLUMN IF EXISTS role,
DROP COLUMN IF EXISTS status,
DROP COLUMN IF EXISTS picture_url,
DROP COLUMN IF EXISTS must_change_password,
DROP COLUMN IF EXISTS offer_expires_at,
DROP COLUMN IF EXISTS created_by,
DROP COLUMN IF EXISTS last_login_at;

-- Supprimer les types enum
DROP TYPE IF EXISTS user_role;
DROP TYPE IF EXISTS user_status;
DROP TYPE IF EXISTS course_type;

-- 2. Recréer tous les objets

-- Créer les enums
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'user');
CREATE TYPE user_status AS ENUM ('prospect', 'active', 'suspended', 'expired');
CREATE TYPE course_type AS ENUM ('L1', 'L2', 'L3', 'CRFPA');

-- Modifier la table users existante pour ajouter les nouveaux champs
ALTER TABLE public.users 
ADD COLUMN role user_role DEFAULT 'user',
ADD COLUMN status user_status DEFAULT 'prospect',
ADD COLUMN picture_url TEXT,
ADD COLUMN must_change_password BOOLEAN DEFAULT FALSE,
ADD COLUMN offer_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN created_by UUID REFERENCES auth.users(id),
ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;

-- Créer la table des accès aux cours
CREATE TABLE public.user_course_access (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    course course_type NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    granted_by UUID REFERENCES auth.users(id),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, course)
);

-- Créer la table pour stocker les mots de passe temporaires
CREATE TABLE public.temporary_passwords (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    temp_password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    created_by UUID REFERENCES auth.users(id)
);

-- Créer des index pour les performances
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_status ON public.users(status);
CREATE INDEX idx_user_course_access_user_id ON public.user_course_access(user_id);
CREATE INDEX idx_user_course_access_course ON public.user_course_access(course);
CREATE INDEX idx_temporary_passwords_user_id ON public.temporary_passwords(user_id);

-- Fonction pour donner tous les accès aux prospects
CREATE OR REPLACE FUNCTION grant_prospect_access()
RETURNS TRIGGER AS $$
BEGIN
    -- Si l'utilisateur est un prospect, lui donner accès à tous les cours
    IF NEW.status = 'prospect' THEN
        INSERT INTO public.user_course_access (user_id, course)
        VALUES 
            (NEW.id, 'L1'),
            (NEW.id, 'L2'),
            (NEW.id, 'L3'),
            (NEW.id, 'CRFPA')
        ON CONFLICT (user_id, course) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour donner automatiquement les accès aux prospects
CREATE TRIGGER trigger_grant_prospect_access
    AFTER INSERT OR UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION grant_prospect_access();

-- Fonction pour créer un utilisateur avec mot de passe temporaire
CREATE OR REPLACE FUNCTION create_user_with_temp_password(
    p_email TEXT,
    p_prenom TEXT,
    p_nom TEXT,
    p_temp_password TEXT,
    p_created_by UUID,
    p_status user_status DEFAULT 'active'
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_auth_user_id UUID;
BEGIN
    -- Créer l'utilisateur dans auth.users avec un mot de passe temporaire
    INSERT INTO auth.users (
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        confirmation_token,
        email_change_token_new,
        recovery_token
    ) VALUES (
        p_email,
        crypt(p_temp_password, gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '',
        '',
        ''
    ) RETURNING id INTO v_auth_user_id;
    
    -- Créer le profil utilisateur
    INSERT INTO public.users (
        id,
        email,
        prenom,
        nom,
        status,
        must_change_password,
        created_by
    ) VALUES (
        v_auth_user_id,
        p_email,
        p_prenom,
        p_nom,
        p_status,
        TRUE,
        p_created_by
    ) RETURNING id INTO v_user_id;
    
    -- Stocker le mot de passe temporaire
    INSERT INTO public.temporary_passwords (
        user_id,
        temp_password_hash,
        created_by
    ) VALUES (
        v_user_id,
        crypt(p_temp_password, gen_salt('bf')),
        p_created_by
    );
    
    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- Politiques RLS simplifiées (sans récursion)
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS pour user_course_access
ALTER TABLE public.user_course_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own course access" ON public.user_course_access
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own course access" ON public.user_course_access
    FOR ALL USING (user_id = auth.uid());

-- RLS pour temporary_passwords
ALTER TABLE public.temporary_passwords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own temp passwords" ON public.temporary_passwords
    FOR SELECT USING (user_id = auth.uid());

-- Fonction utilitaire pour vérifier les permissions admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = user_id 
        AND role IN ('admin', 'owner')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le premier utilisateur owner (à adapter avec votre email)
-- IMPORTANT: Changez l'email ci-dessous par votre email
-- UPDATE public.users 
-- SET role = 'owner', status = 'active' 
-- WHERE email = 'votre-email@example.com';

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Migration terminée avec succès!';
    RAISE NOTICE 'N''oubliez pas de mettre à jour l''email du propriétaire dans la dernière requête UPDATE.';
END $$; 