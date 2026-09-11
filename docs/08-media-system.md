# 08. Media system

## Principles

- Use optimized images for remote images.
- Use thumbnails in lists.
- Compress before upload.
- Keep upload API orchestration outside visual components.
- Provide placeholders for missing images.
- Use meaningful alt/accessibility text when image content matters.

## Ownership

| Concern             | Owner                            |
| ------------------- | -------------------------------- |
| Pick/capture UI     | `ImageUploader`, `CameraCapture` |
| Compression         | media utility/service hook       |
| API upload          | API service/hook                 |
| Grid display        | `PhotoGrid`                      |
| Full-screen viewing | `ImageViewer`                    |
| Proof viewing       | `ProofPhotoViewer`               |

## Upload flow

```txt
ImagePickerField
  onAddPress
    feature hook opens picker/camera
    utility compresses image
    API hook uploads image
    form state updates
```

## Performance

- Do not render full-size images in lists.
- Avoid large grids inside unbounded ScrollViews.
- Do not store base64 in React state unless unavoidable.
- Keep signed URL refresh in services/hooks.
