namespace Kanbex.Web.Services;

/// <summary>
/// Хранение аватаров в `wwwroot/uploads`. Тип определяется по сигнатуре, а не
/// по расширению или клиентскому Content-Type; имя файла случайное, поэтому
/// traversal и подмена расширения невозможны.
/// </summary>
public sealed class AvatarStorage(IWebHostEnvironment environment)
{
    private const long MaxBytes = 2 * 1024 * 1024;
    private const string UploadFolder = "uploads";

    private static readonly byte[] JpegSignature = [0xFF, 0xD8, 0xFF];
    private static readonly byte[] PngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
    private static readonly byte[] WebpRiff = "RIFF"u8.ToArray();
    private static readonly byte[] WebpMarker = "WEBP"u8.ToArray();

    public async Task<string> SaveAsync(IFormFile file, CancellationToken cancellationToken)
    {
        if (file.Length <= 0)
        {
            throw new AvatarValidationException("Файл аватара пуст.");
        }

        if (file.Length > MaxBytes)
        {
            throw new AvatarValidationException("Аватар должен быть не больше 2 МБ.");
        }

        var buffer = new byte[file.Length];
        using var source = file.OpenReadStream();
        await source.ReadExactlyAsync(buffer, cancellationToken);

        var extension = DetectExtension(buffer)
            ?? throw new AvatarValidationException("Поддерживаются только JPEG, PNG и WebP.");

        var webRoot = environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot");
        var folder = Path.Combine(webRoot, UploadFolder);
        Directory.CreateDirectory(folder);

        var fileName = $"{Guid.NewGuid():N}.{extension}";
        await File.WriteAllBytesAsync(Path.Combine(folder, fileName), buffer, cancellationToken);
        return $"/{UploadFolder}/{fileName}";
    }

    public void Delete(string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return;
        }

        var fileName = Path.GetFileName(url);
        if (string.IsNullOrWhiteSpace(fileName))
        {
            return;
        }

        var webRoot = environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot");
        var path = Path.Combine(webRoot, UploadFolder, fileName);
        if (File.Exists(path))
        {
            File.Delete(path);
        }
    }

    private static string? DetectExtension(byte[] buffer)
    {
        if (buffer.Length >= 3 && buffer.AsSpan(0, 3).SequenceEqual(JpegSignature))
        {
            return "jpg";
        }

        if (buffer.Length >= 8 && buffer.AsSpan(0, 8).SequenceEqual(PngSignature))
        {
            return "png";
        }

        if (buffer.Length >= 12 &&
            buffer.AsSpan(0, 4).SequenceEqual(WebpRiff) &&
            buffer.AsSpan(8, 4).SequenceEqual(WebpMarker))
        {
            return "webp";
        }

        return null;
    }
}

public sealed class AvatarValidationException(string message) : Exception(message);
