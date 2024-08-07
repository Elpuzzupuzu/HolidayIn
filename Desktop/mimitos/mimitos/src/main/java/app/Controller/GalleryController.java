package app.Controller;

import app.Model.Gallery;
import app.Service.GalleryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/gallery")
public class GalleryController {

    @Autowired
    private GalleryService galleryService;

    @GetMapping("allgallery")
    public List<Gallery> getAllImages() {
        return galleryService.getAllImages();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Gallery> getImageById(@PathVariable("id") Long id) {
        Optional<Gallery> image = galleryService.getImageById(id);
        return image.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("creategallery")
    public ResponseEntity<Gallery> createImage(@RequestBody Gallery image) {
        Gallery createdImage = galleryService.createOrUpdateImage(image);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdImage);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Gallery> updateImage(@PathVariable("id") Long id, @RequestBody Gallery image) {
        image.setId(id); // asegura que se actualice la imagen correcta
        Gallery updatedImage = galleryService.createOrUpdateImage(image);
        return ResponseEntity.ok(updatedImage);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteImage(@PathVariable("id") Long id) {
        galleryService.deleteImage(id);
        return ResponseEntity.noContent().build();
    }
}
