package app.Service;

import app.Model.Gallery;
import app.Repository.GalleryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class GalleryService {

    @Autowired
    private GalleryRepository galleryRepository;

    public List<Gallery> getAllImages() {
        return galleryRepository.findAll();
    }

    public Optional<Gallery> getImageById(Long id) {
        return galleryRepository.findById(id);
    }

    public Gallery createOrUpdateImage(Gallery image) {
        return galleryRepository.save(image);
    }

    public void deleteImage(Long id) {
        galleryRepository.deleteById(id);
    }
}
