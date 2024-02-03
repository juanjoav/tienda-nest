import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {


  private readonly logger = new Logger('ProductsService');

  constructor(

    @InjectRepository(Product)
    private productRepository: Repository<Product>
  ) { }

  async create(createProductDto: CreateProductDto) {
    try {
      const product = this.productRepository.create(createProductDto);
      return await this.productRepository.save(product);
    }
    catch (error) {

      this.handleDBExceptions(error);
    }
  }

  async findAll() {
    try {
      return await this.productRepository.find();
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findOne(id: string) {
    
    const product = await this.productRepository.findOneBy({id});
      //return await this.productRepository.findByIds([id]);
     // return await this.productRepository.findOneBy({ id: id });
     if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`	);
     }
      return product;
    
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
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
}
