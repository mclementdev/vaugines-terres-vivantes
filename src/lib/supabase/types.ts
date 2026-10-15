
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "actions": {
                  Row: {
                    "commission_id": string | null,"created_at": string,"description_html": string | null,"id": string,"image_alt": string | null,"image_path": string | null,"is_sample": boolean,"lien_href": string | null,"lien_label": string | null,"periode": string,"position": number,"published_at": string | null,"resume": string,"slug": string,"status": Database["public"]['Enums']["content_status"],"titre": string,"ton": Database["public"]['Enums']["ton"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "commission_id"?: string | null,"created_at"?: string,"description_html"?: string | null,"id"?: string,"image_alt"?: string | null,"image_path"?: string | null,"is_sample"?: boolean,"lien_href"?: string | null,"lien_label"?: string | null,"periode": string,"position"?: number,"published_at"?: string | null,"resume": string,"slug": string,"status"?: Database["public"]['Enums']["content_status"],"titre": string,"ton"?: Database["public"]['Enums']["ton"],"updated_at"?: string
                  }
                  Update: {
                    "commission_id"?: string | null,"created_at"?: string,"description_html"?: string | null,"id"?: string,"image_alt"?: string | null,"image_path"?: string | null,"is_sample"?: boolean,"lien_href"?: string | null,"lien_label"?: string | null,"periode"?: string,"position"?: number,"published_at"?: string | null,"resume"?: string,"slug"?: string,"status"?: Database["public"]['Enums']["content_status"],"titre"?: string,"ton"?: Database["public"]['Enums']["ton"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "actions_commission_id_fkey"
      columns: ["commission_id"]
isOneToOne: false
      referencedRelation: "commissions"
      referencedColumns: ["id"]
    }
                  ]
                },"articles": {
                  Row: {
                    "author_id": string | null,"author_label": string,"body_html": string,"body_json": Json | null,"category_id": string | null,"chapeau": string,"cover_alt": string | null,"cover_caption": string | null,"cover_path": string | null,"created_at": string,"featured": boolean,"id": string,"is_sample": boolean,"newsletter_candidate": boolean,"published_at": string | null,"slug": string,"status": Database["public"]['Enums']["content_status"],"tags": (string)[],"titre": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"author_label"?: string,"body_html"?: string,"body_json"?: Json | null,"category_id"?: string | null,"chapeau"?: string,"cover_alt"?: string | null,"cover_caption"?: string | null,"cover_path"?: string | null,"created_at"?: string,"featured"?: boolean,"id"?: string,"is_sample"?: boolean,"newsletter_candidate"?: boolean,"published_at"?: string | null,"slug": string,"status"?: Database["public"]['Enums']["content_status"],"tags"?: (string)[],"titre": string,"updated_at"?: string
                  }
                  Update: {
                    "author_id"?: string | null,"author_label"?: string,"body_html"?: string,"body_json"?: Json | null,"category_id"?: string | null,"chapeau"?: string,"cover_alt"?: string | null,"cover_caption"?: string | null,"cover_path"?: string | null,"created_at"?: string,"featured"?: boolean,"id"?: string,"is_sample"?: boolean,"newsletter_candidate"?: boolean,"published_at"?: string | null,"slug"?: string,"status"?: Database["public"]['Enums']["content_status"],"tags"?: (string)[],"titre"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "articles_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "articles_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    }
                  ]
                },"audit_log": {
                  Row: {
                    "action": string,"actor_id": string | null,"cible": string | null,"created_at": string,"detail": NonNullable<Json>,"id": number
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"cible"?: string | null,"created_at"?: string,"detail"?: NonNullable<Json>,"id"?: never
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"cible"?: string | null,"created_at"?: string,"detail"?: NonNullable<Json>,"id"?: never
                  }
                  Relationships: [
                    {
      foreignKeyName: "audit_log_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"categories": {
                  Row: {
                    "id": string,"nom": string,"position": number,"slug": string,"ton": Database["public"]['Enums']["ton"]
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"nom": string,"position"?: number,"slug": string,"ton"?: Database["public"]['Enums']["ton"]
                  }
                  Update: {
                    "id"?: string,"nom"?: string,"position"?: number,"slug"?: string,"ton"?: Database["public"]['Enums']["ton"]
                  }
                  Relationships: [
                    
                  ]
                },"commissions": {
                  Row: {
                    "created_at": string,"description": string | null,"id": string,"nom": string,"position": number,"published_at": string | null,"slug": string,"status": Database["public"]['Enums']["content_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"nom": string,"position"?: number,"published_at"?: string | null,"slug": string,"status"?: Database["public"]['Enums']["content_status"],"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"nom"?: string,"position"?: number,"published_at"?: string | null,"slug"?: string,"status"?: Database["public"]['Enums']["content_status"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"council_members": {
                  Row: {
                    "created_at": string,"id": string,"nom": string,"photo_path": string | null,"position": number,"prenom": string,"role": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"nom": string,"photo_path"?: string | null,"position"?: number,"prenom": string,"role"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"nom"?: string,"photo_path"?: string | null,"position"?: number,"prenom"?: string,"role"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"events": {
                  Row: {
                    "accessibilite": string | null,"adresse": string | null,"all_day": boolean,"body_html": string,"body_json": Json | null,"capacity": number | null,"cover_alt": string | null,"cover_path": string | null,"created_at": string,"date_label": string | null,"ends_at": string | null,"featured": boolean,"id": string,"infos_pratiques": string | null,"is_sample": boolean,"latitude": number | null,"lieu": string,"longitude": number | null,"ouvert_a_tous": boolean,"prix": string,"programme": NonNullable<Json>,"published_at": string | null,"registration_enabled": boolean,"resume": string,"slug": string,"starts_at": string | null,"status": Database["public"]['Enums']["content_status"],"titre": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accessibilite"?: string | null,"adresse"?: string | null,"all_day"?: boolean,"body_html"?: string,"body_json"?: Json | null,"capacity"?: number | null,"cover_alt"?: string | null,"cover_path"?: string | null,"created_at"?: string,"date_label"?: string | null,"ends_at"?: string | null,"featured"?: boolean,"id"?: string,"infos_pratiques"?: string | null,"is_sample"?: boolean,"latitude"?: number | null,"lieu"?: string,"longitude"?: number | null,"ouvert_a_tous"?: boolean,"prix"?: string,"programme"?: NonNullable<Json>,"published_at"?: string | null,"registration_enabled"?: boolean,"resume"?: string,"slug": string,"starts_at"?: string | null,"status"?: Database["public"]['Enums']["content_status"],"titre": string,"updated_at"?: string
                  }
                  Update: {
                    "accessibilite"?: string | null,"adresse"?: string | null,"all_day"?: boolean,"body_html"?: string,"body_json"?: Json | null,"capacity"?: number | null,"cover_alt"?: string | null,"cover_path"?: string | null,"created_at"?: string,"date_label"?: string | null,"ends_at"?: string | null,"featured"?: boolean,"id"?: string,"infos_pratiques"?: string | null,"is_sample"?: boolean,"latitude"?: number | null,"lieu"?: string,"longitude"?: number | null,"ouvert_a_tous"?: boolean,"prix"?: string,"programme"?: NonNullable<Json>,"published_at"?: string | null,"registration_enabled"?: boolean,"resume"?: string,"slug"?: string,"starts_at"?: string | null,"status"?: Database["public"]['Enums']["content_status"],"titre"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"faq_items": {
                  Row: {
                    "answer_html": string,"category": Database["public"]['Enums']["faq_category"],"created_at": string,"home_position": number | null,"id": string,"position": number,"published_at": string | null,"question": string,"show_on_home": boolean,"status": Database["public"]['Enums']["content_status"],"to_validate": boolean,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "answer_html": string,"category": Database["public"]['Enums']["faq_category"],"created_at"?: string,"home_position"?: number | null,"id"?: string,"position"?: number,"published_at"?: string | null,"question": string,"show_on_home"?: boolean,"status"?: Database["public"]['Enums']["content_status"],"to_validate"?: boolean,"updated_at"?: string
                  }
                  Update: {
                    "answer_html"?: string,"category"?: Database["public"]['Enums']["faq_category"],"created_at"?: string,"home_position"?: number | null,"id"?: string,"position"?: number,"published_at"?: string | null,"question"?: string,"show_on_home"?: boolean,"status"?: Database["public"]['Enums']["content_status"],"to_validate"?: boolean,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"glossary_terms": {
                  Row: {
                    "categorie": Database["public"]['Enums']["glossary_category"],"created_at": string,"definition": string,"id": string,"published_at": string | null,"slug": string,"status": Database["public"]['Enums']["content_status"],"terme": string,"to_validate": boolean,"updated_at": string,"voir_aussi": (string)[]
                  }
                  ComputedFields: never
                  Insert: {
                    "categorie": Database["public"]['Enums']["glossary_category"],"created_at"?: string,"definition": string,"id"?: string,"published_at"?: string | null,"slug": string,"status"?: Database["public"]['Enums']["content_status"],"terme": string,"to_validate"?: boolean,"updated_at"?: string,"voir_aussi"?: (string)[]
                  }
                  Update: {
                    "categorie"?: Database["public"]['Enums']["glossary_category"],"created_at"?: string,"definition"?: string,"id"?: string,"published_at"?: string | null,"slug"?: string,"status"?: Database["public"]['Enums']["content_status"],"terme"?: string,"to_validate"?: boolean,"updated_at"?: string,"voir_aussi"?: (string)[]
                  }
                  Relationships: [
                    
                  ]
                },"home_blocks": {
                  Row: {
                    "content": NonNullable<Json>,"key": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "content": NonNullable<Json>,"key": string,"updated_at"?: string
                  }
                  Update: {
                    "content"?: NonNullable<Json>,"key"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"ideas": {
                  Row: {
                    "author_email": string | null,"comment_count": number,"created_at": string,"description": string,"display_name": string | null,"id": string,"is_sample": boolean,"moderation": Database["public"]['Enums']["idea_moderation"],"photo_path": string | null,"progress": Database["public"]['Enums']["idea_progress"],"published_at": string | null,"slug": string,"support_count": number,"theme": Database["public"]['Enums']["idea_theme"],"titre": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_email"?: string | null,"comment_count"?: number,"created_at"?: string,"description": string,"display_name"?: string | null,"id"?: string,"is_sample"?: boolean,"moderation"?: Database["public"]['Enums']["idea_moderation"],"photo_path"?: string | null,"progress"?: Database["public"]['Enums']["idea_progress"],"published_at"?: string | null,"slug": string,"support_count"?: number,"theme": Database["public"]['Enums']["idea_theme"],"titre": string,"updated_at"?: string
                  }
                  Update: {
                    "author_email"?: string | null,"comment_count"?: number,"created_at"?: string,"description"?: string,"display_name"?: string | null,"id"?: string,"is_sample"?: boolean,"moderation"?: Database["public"]['Enums']["idea_moderation"],"photo_path"?: string | null,"progress"?: Database["public"]['Enums']["idea_progress"],"published_at"?: string | null,"slug"?: string,"support_count"?: number,"theme"?: Database["public"]['Enums']["idea_theme"],"titre"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"private_settings": {
                  Row: {
                    "data": NonNullable<Json>,"id": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "data"?: NonNullable<Json>,"id"?: number,"updated_at"?: string
                  }
                  Update: {
                    "data"?: NonNullable<Json>,"id"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"email": string | null,"id": string,"invited_at": string | null,"nom": string,"prenom": string,"role": Database["public"]['Enums']["admin_role"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email"?: string | null,"id": string,"invited_at"?: string | null,"nom"?: string,"prenom"?: string,"role"?: Database["public"]['Enums']["admin_role"],"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string | null,"id"?: string,"invited_at"?: string | null,"nom"?: string,"prenom"?: string,"role"?: Database["public"]['Enums']["admin_role"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"rate_limits": {
                  Row: {
                    "hits": number,"key": string,"window_start": string
                  }
                  ComputedFields: never
                  Insert: {
                    "hits"?: number,"key": string,"window_start": string
                  }
                  Update: {
                    "hits"?: number,"key"?: string,"window_start"?: string
                  }
                  Relationships: [
                    
                  ]
                },"site_settings": {
                  Row: {
                    "data": NonNullable<Json>,"id": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "data"?: NonNullable<Json>,"id"?: number,"updated_at"?: string
                  }
                  Update: {
                    "data"?: NonNullable<Json>,"id"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"statuts_articles": {
                  Row: {
                    "body_html": string,"numero": number,"titre": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body_html": string,"numero": number,"titre": string,"updated_at"?: string
                  }
                  Update: {
                    "body_html"?: string,"numero"?: number,"titre"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"veille_dossiers": {
                  Row: {
                    "article_id": string | null,"created_at": string,"featured": boolean,"id": string,"image_alt": string | null,"image_path": string | null,"intro": string,"is_sample": boolean,"published_at": string | null,"slug": string,"status": Database["public"]['Enums']["content_status"],"titre": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "article_id"?: string | null,"created_at"?: string,"featured"?: boolean,"id"?: string,"image_alt"?: string | null,"image_path"?: string | null,"intro": string,"is_sample"?: boolean,"published_at"?: string | null,"slug": string,"status"?: Database["public"]['Enums']["content_status"],"titre": string,"updated_at"?: string
                  }
                  Update: {
                    "article_id"?: string | null,"created_at"?: string,"featured"?: boolean,"id"?: string,"image_alt"?: string | null,"image_path"?: string | null,"intro"?: string,"is_sample"?: boolean,"published_at"?: string | null,"slug"?: string,"status"?: Database["public"]['Enums']["content_status"],"titre"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "veille_dossiers_article_id_fkey"
      columns: ["article_id"]
isOneToOne: false
      referencedRelation: "articles"
      referencedColumns: ["id"]
    }
                  ]
                },"veille_items": {
                  Row: {
                    "created_at": string,"date_info": string | null,"dossier_id": string | null,"id": string,"is_sample": boolean,"published_at": string | null,"resume": string,"source_label": string,"source_url": string | null,"status": Database["public"]['Enums']["content_status"],"theme": Database["public"]['Enums']["veille_theme"],"titre": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"date_info"?: string | null,"dossier_id"?: string | null,"id"?: string,"is_sample"?: boolean,"published_at"?: string | null,"resume": string,"source_label": string,"source_url"?: string | null,"status"?: Database["public"]['Enums']["content_status"],"theme": Database["public"]['Enums']["veille_theme"],"titre": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"date_info"?: string | null,"dossier_id"?: string | null,"id"?: string,"is_sample"?: boolean,"published_at"?: string | null,"resume"?: string,"source_label"?: string,"source_url"?: string | null,"status"?: Database["public"]['Enums']["content_status"],"theme"?: Database["public"]['Enums']["veille_theme"],"titre"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "veille_items_dossier_id_fkey"
      columns: ["dossier_id"]
isOneToOne: false
      referencedRelation: "veille_dossiers"
      referencedColumns: ["id"]
    }
                  ]
                },"veille_reports": {
                  Row: {
                    "created_at": string,"email": string | null,"id": string,"message": string,"treated_at": string | null,"url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email"?: string | null,"id"?: string,"message": string,"treated_at"?: string | null,"url"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"email"?: string | null,"id"?: string,"message"?: string,"treated_at"?: string | null,"url"?: string | null
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            "ideas_public": {
                  Row: {
                    "comment_count": number | null,"description": string | null,"display_name": string | null,"id": string | null,"is_sample": boolean | null,"photo_path": string | null,"progress": Database["public"]['Enums']["idea_progress"] | null,"published_at": string | null,"slug": string | null,"support_count": number | null,"theme": Database["public"]['Enums']["idea_theme"] | null,"titre": string | null
                  }
                  ComputedFields: never
                  Insert: {
                           "comment_count"?: number | null,"description"?: string | null,"display_name"?: string | null,"id"?: string | null,"is_sample"?: boolean | null,"photo_path"?: string | null,"progress"?: Database["public"]['Enums']["idea_progress"] | null,"published_at"?: string | null,"slug"?: string | null,"support_count"?: number | null,"theme"?: Database["public"]['Enums']["idea_theme"] | null,"titre"?: string | null
                         }
                        Update: {
                           "comment_count"?: number | null,"description"?: string | null,"display_name"?: string | null,"id"?: string | null,"is_sample"?: boolean | null,"photo_path"?: string | null,"progress"?: Database["public"]['Enums']["idea_progress"] | null,"published_at"?: string | null,"slug"?: string | null,"support_count"?: number | null,"theme"?: Database["public"]['Enums']["idea_theme"] | null,"titre"?: string | null
                         }
                        Relationships: [
                    
                  ]
                }
          }
          Functions: {
            "compter_exemples":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"hit_rate_limit":
{ Args: { "p_key": string,"p_max": number,"p_window_seconds": number }; Returns: boolean
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_superadmin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_visible":
{ Args: { "published_at": string,"s": Database["public"]['Enums']["content_status"] }; Returns: boolean
                           },
"public_stats":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"purger_exemples":
{ Args: Record<PropertyKey, never>; Returns: Json
                           }
          }
          Enums: {
            "admin_role": "superadmin"|"admin","content_status": "draft"|"published"|"trashed","faq_category": "association"|"adherer"|"cotisation"|"evenements"|"participer"|"donnees","glossary_category": "democratie"|"environnement"|"agriculture"|"association","idea_moderation": "pending"|"changes_requested"|"published"|"rejected","idea_progress": "proposee"|"etudiee"|"en_projet"|"realisee","idea_theme": "cadre_de_vie"|"eau"|"biodiversite"|"mobilite"|"patrimoine"|"energie"|"vivre_ensemble","ton": "terre"|"olive"|"indigo"|"abricot","veille_theme": "environnement"|"urbanisme"|"eau"|"energie"|"democratie_locale"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "admin_role": ["superadmin", "admin"],"content_status": ["draft", "published", "trashed"],"faq_category": ["association", "adherer", "cotisation", "evenements", "participer", "donnees"],"glossary_category": ["democratie", "environnement", "agriculture", "association"],"idea_moderation": ["pending", "changes_requested", "published", "rejected"],"idea_progress": ["proposee", "etudiee", "en_projet", "realisee"],"idea_theme": ["cadre_de_vie", "eau", "biodiversite", "mobilite", "patrimoine", "energie", "vivre_ensemble"],"ton": ["terre", "olive", "indigo", "abricot"],"veille_theme": ["environnement", "urbanisme", "eau", "energie", "democratie_locale"]
          }
        }
} as const
