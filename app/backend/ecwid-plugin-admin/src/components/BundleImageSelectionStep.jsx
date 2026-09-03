import React, { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Grid,
    Card,
    CardMedia,
    CardContent,
    FormControlLabel,
    Checkbox,
    Input,
} from '@mui/material';

const BundleImageSelectionStep = ({ products, newBundle, setNewBundle, api }) => {
    const [mainImage, setMainImage] = useState(newBundle.mainImage || '');
    const [galleryImages, setGalleryImages] = useState(newBundle.bundleImages || []);
    const [uploading, setUploading] = useState(false);

    // Handle main image change
    const handleMainImageChange = (imageUrl) => {
        setMainImage(imageUrl);
        setNewBundle((prev) => ({
            ...prev,
            mainImage: imageUrl,
        }));
    };

    // Handle gallery image change
    const handleGalleryImageChange = (imageUrl) => {
        setGalleryImages((prev) => {
            const updatedGalleryImages = prev.includes(imageUrl)
                ? prev.filter((url) => url !== imageUrl)
                : [...prev, imageUrl];

            setNewBundle((prev) => ({
                ...prev,
                bundleImages: updatedGalleryImages,
            }));

            return updatedGalleryImages;
        });
    };

    // Handle image upload
    const handleImageUpload = (event, type) => {
        const file = event.target.files[0];

        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);

        // API call to upload the image
        api.post('/api/upload-image', formData)
            .then((response) => {
                const uploadedImageUrl = response.data.imageUrl;

                if (type === 'main') {
                    setMainImage(uploadedImageUrl);
                    setNewBundle((prev) => ({
                        ...prev,
                        mainImage: uploadedImageUrl,
                    }));
                } else if (type === 'gallery') {
                    setGalleryImages((prev) => [...prev, uploadedImageUrl]);
                    setNewBundle((prev) => ({
                        ...prev,
                        bundleImages: [...prev.bundleImages, uploadedImageUrl],
                    }));
                }

                setUploading(false);
            })
            .catch((error) => {
                console.error('Error uploading image:', error);
                setUploading(false);
            });
    };

    return (
        <Box sx={{ width: '100%' }}>
            {/* Main Image Section */}
            <Card variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Select Main Image
                </Typography>
                <Grid container spacing={2}>
                    {products
                        .filter(product => newBundle.productIds.includes(product.id))
                        .map(product => (
                            <Grid item key={product.id} xs={6} sm={4} md={3}>
                                <Card>
                                    <CardMedia
                                        component="img"
                                        alt={product.name}
                                        height="140"
                                        image={product.imageUrl || 'https://placehold.co/150'}
                                        title={product.name}
                                    />
                                    <CardContent>
                                        <Button
                                            fullWidth
                                            variant={mainImage === product.imageUrl ? 'contained' : 'outlined'}
                                            color="primary"
                                            onClick={() => handleMainImageChange(product.imageUrl)}
                                        >
                                            {mainImage === product.imageUrl ? 'Main Image Selected' : 'Set as Main Image'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                </Grid>

                {/* Main Image Upload */}
                <Box sx={{ mt: 2, border: '1px dashed gray', p: 2, borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="body1" fontWeight="bold" component="label" sx={{ cursor: 'pointer' }}>
                        Upload Main Image &nbsp;
                        <Input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 'main')}
                        />
                    </Typography>
                </Box>
            </Card>

            {/* Gallery Image Section */}
            <Card variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Select Gallery Images
                </Typography>
                <Grid container spacing={2}>
                    {products
                        .filter(product => newBundle.productIds.includes(product.id))
                        .map(product => (
                            <Grid item key={product.id} xs={6} sm={4} md={3}>
                                <Card>
                                    <CardMedia
                                        component="img"
                                        alt={product.name}
                                        height="140"
                                        image={product.imageUrl || 'https://placehold.co/150'}
                                        title={product.name}
                                    />
                                    <CardContent>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={galleryImages.includes(product.imageUrl)}
                                                    onChange={() => handleGalleryImageChange(product.imageUrl)}
                                                />
                                            }
                                            label="Select for Gallery"
                                        />
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                </Grid>

                {/* Gallery Image Upload */}
                <Box sx={{ mt: 2, border: '1px dashed gray', p: 2, borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="body1" fontWeight="bold" component="label" sx={{ cursor: 'pointer' }}>
                        Upload Gallery Image &nbsp;
                        <Input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 'gallery')}
                        />
                    </Typography>
                </Box>
            </Card>

            {/* Display Uploaded Images */}
            <Card variant="outlined" sx={{ p: 2, mt: 3 }}>
                <Typography variant="h6">Uploaded Images</Typography>
                <Grid container spacing={2}>
                    {[mainImage, ...galleryImages].map((imageUrl, index) => (
                        <Grid item key={index} xs={6} sm={4} md={3}>
                            <Card>
                                <CardMedia
                                    component="img"
                                    alt={`Uploaded image ${index + 1}`}
                                    height="140"
                                    image={imageUrl || 'https://placehold.co/150'}
                                    title={`Uploaded image ${index + 1}`}
                                />
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Card>

            {/* Uploading Spinner */}
            {uploading && <Typography variant="body2">Uploading...</Typography>}
        </Box>
    );
};

export default BundleImageSelectionStep;