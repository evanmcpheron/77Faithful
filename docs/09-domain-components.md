# 09. Domain components

## Placement

Default:

```txt
src/features/<feature>/components
src/features/<feature>/forms
```

Move to `src/components/domain` only after cross-feature reuse is proven.

## Checklist rule

- Checklist templates are reusable company-level definitions.
- Room checklist assignments are room-specific.
- Customizing a room checklist must not mutate the original template unless
  explicitly intended.

Recommended flow:

1. Assign template to room.
2. User taps customize.
3. Show `ChecklistCustomizePrompt`.
4. Create/update room-specific checklist instance.
5. Keep template unchanged.

## Job assignment rule

- Owner creates job from property/room.
- Assignment target is either internal team member or external provider company.
- Provider company can later assign internally to its own workers.
- Provider workers are not owner company team members.

## Inventory rule

Inventory is room-specific by default. Property inventory views aggregate room
inventory.
