import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { validate as isUUID } from 'uuid';
import { ProductImage } from './entities';

@Injectable()
export class ProductsService {


  private readonly logger = new Logger('ProductsService');

  constructor(

    @InjectRepository(Product)
    private productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private productImageRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource
  ) { }

  async create(createProductDto: CreateProductDto) {
    try {
      const { images = [], ...productDeatils } = createProductDto;

      const product = this.productRepository.create({
        ...productDeatils,
        images: images.map(image => this.productImageRepository.create({ url: image }))
      });
      await this.productRepository.save(product);

      return { ...product, images };

    }
    catch (error) {

      this.handleDBExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    try {

      const { limit = 10, offset = 0 } = paginationDto;


      const products = await this.productRepository.find(
        {
          take: limit,
          skip: offset,
          relations: {
            images: true

          }
        }
      )

      return products.map(({ images, ...rest }) =>
        ({ ...rest, images: images.map(image => image.url) }));

      // return products.map( product => ({...product, 
      //   images: product.images.map( image => image.url)}));
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findOne(term: string) {

    let product: Product;

    if (isUUID(term)) {
      product = await this.productRepository.findOneBy({ id: term }); // se puede hacer con un .find y un where
    } else {
      //product = await this.productRepository.findOneBy({ slug: term});
      const queryBuilder = this.productRepository.createQueryBuilder('product');
      product = await queryBuilder
        .where('UPPER(title) =:title or slug = :slug',
          { title: term.toUpperCase(), slug: term })
        .leftJoinAndSelect('product.images', 'prodImages')
        .getOne();
    }

    //const product = await this.productRepository.findOneBy({id: term});
    //return await this.productRepository.findByIds([id]);
    // return await this.productRepository.findOneBy({ id: id });
    if (!product) {
      throw new NotFoundException(`Product with ${term} not found`);
    }

    return product;

  }


  async findOnePlain(term: string) {
    const { images = [], ...rest } = await this.findOne(term);
    return {
      ...rest,
      images: images.map(image => image.url)
    };
  }

  async update(id: string, updateProductDto: UpdateProductDto) {

    const { images, ...toUpdate } = updateProductDto;

    const product = await this.productRepository.preload({
      id: id,
      ...toUpdate,
      images: []
    });

    if (!product) throw new NotFoundException(`Product with ID ${id} not found`);

    // Create quert runner
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      if (images) {
        await queryRunner.manager.delete(ProductImage, { product: { id } }); // facilmente puede borrar todo

        product.images = images.map(image => this.productImageRepository.create({ url: image }));

      } //else {
        ////?
        //product.images = await this.productImageRepository.findBy({ product: { id } });

     // }

      await queryRunner.manager.save(product);
      await queryRunner.commitTransaction();
      await queryRunner.release();

      //return product;
      return this.findOnePlain(id);

      // await this.productRepository.save(product);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.handleDBExceptions(error);
    }


  }

  async remove(id: string) {
    const product = await this.findOne(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return await this.productRepository.remove(product);
  }

  private handleDBExceptions(error: any) {
    if (error.code === '23505') {
      throw new BadRequestException('Duplicate product name');
    }

    this.logger.error(error);
    console.log(error.code);
    throw new InternalServerErrorException('Unexpected error occured');
  }

  async deleteAllProducts() {
    const query = this.productRepository.createQueryBuilder('product');
    try {
      return await query
      .delete()
      .where({})
      .execute();
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }
}
