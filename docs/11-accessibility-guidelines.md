# 11. Accessibility guidelines

## Baseline

- Pressable controls use `accessibilityRole='button'` unless another role is
  better.
- Icon-only buttons require `accessibilityLabel`.
- Disabled controls set `disabled` and disabled accessibility state.
- Selected tabs/chips/radios set selected state.
- Dropdown triggers set expanded state.
- Touch targets are at least 44x44.
- Do not rely on color alone for status.
- Text should remain readable with system font scaling.

## Component rules

| Component         | Rule                                |
| ----------------- | ----------------------------------- |
| TurndownButton    | role button, disabled/loading state |
| IconButton        | required label                      |
| Dropdown          | expanded state, selected state      |
| Checkbox          | checkbox role and checked state     |
| RadioButton       | radio role and selected state       |
| Tabs              | selected tab state                  |
| Modal/BottomSheet | clear close action                  |
| ImageViewer       | close button and image context      |

## Good labels

- `Close filter panel`
- `Select Residential business type`
- `Remove pillow from inventory`
- `View proof photo for pillow checklist item`
- `Assign job to external provider company`
