# 10. Screen composition patterns

## Auth

```txt
AuthShell
  Tabs
    LoginForm
    RegisterForm
```

## Property list

```txt
ListScreen
  header: DashboardHeader + PropertySearchBar + PropertyStatsGrid
  rows: PropertyCard[]
  action: FloatingActionButton or primary button
```

## Property create/edit

```txt
ScrollScreen
  ScreenHeader
  PropertyForm
  PropertyAccessForm
  StickyFooter/FormActions
```

## Property details

```txt
ScrollScreen
  PropertyDetailsHeader
  PropertyStatsGrid
  PropertyRoomSummary
  PropertyJobSummary
  Inventory/Damage summary sections
```

## Add room

```txt
ScrollScreen
  ScreenHeader
  RoomPhotoHeader
  RoomForm
  RoomInventoryCard
  RoomChecklistAssignmentCard
  StickyFooter
```

## Checklist standards

```txt
ListScreen
  header: ScreenHeader + SearchInput + filter + New Checklist
  rows: ChecklistTemplateCard[]
```

## New checklist

```txt
ScrollScreen
  ScreenHeader
  checklist fields
  ChecklistSection
    ChecklistItemEditor[]
  StickyFooter
```

## Jobs list

```txt
ListScreen
  header: DashboardHeader + JobDateStrip + JobTypeSegmentedControl + JobSummaryStats + Search/filter
  rows: JobCard[]
```

## Job creation

```txt
ScrollScreen
  ScreenHeader
  JobCreateForm
  JobAssignmentModal
```

## Track job status

```txt
ScrollScreen
  JobTrackHeader
  ChecklistProgressHeader
  JobChecklistExecutionTable
  JobPendingItemsTable
  JobDamageReportSection
  JobInventoryShortageSection
```

## Team

```txt
ListScreen
  ScreenHeader
  summary stats
  SearchInput + TeamFilterPanel
  InviteTeamMember action
  TeamMemberTable
```

## Settings

```txt
ScrollScreen
  ScreenHeader
  ActionRow[]
  Sign out button
```
